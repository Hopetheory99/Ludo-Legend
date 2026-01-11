
import { GoogleGenAI } from "@google/genai";
import { Player, Piece } from "../types";
import { PERSONALITIES, PROMPT_TEMPLATES, PersonalityId } from "../constants/aiConfig";
import { canPieceMove, getGlobalPosition, calculateNextPosition, findCaptures } from "./ruleService";
import { GAME_RULES } from "../constants/gameRules";
import { isSafeTile } from "./geometryService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility to call Gemini with exponential backoff and retry logic.
 */
async function callGeminiWithRetry(
  prompt: string,
  config: any,
  maxRetries = 3,
  initialDelay = 1000
): Promise<string | null> {
  let delay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: config,
      });
      return response.text?.trim() || null;
    } catch (error: any) {
      const isQuotaError = error?.message?.includes("429") || error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED");
      
      if (isQuotaError && i < maxRetries - 1) {
        console.warn(`Gemini API quota exceeded. Retrying in ${delay}ms... (Attempt ${i + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      
      console.error("Gemini API Error:", error);
      break; 
    }
  }
  return null;
}

/**
 * Heuristic Fallback: Calculates the most strategic move based on Ludo logic.
 * Used when Gemini is unavailable or provides an invalid move.
 */
function getHeuristicMove(player: Player, diceValue: number, allPlayers: Player[]): string | null {
  const movablePieces = player.pieces.filter(p => canPieceMove(p, diceValue));
  if (movablePieces.length === 0) return null;

  // 1. Priority: Capture an opponent
  for (const piece of movablePieces) {
    const nextPos = calculateNextPosition(piece, diceValue);
    const captures = findCaptures(piece, nextPos, allPlayers);
    if (captures.length > 0) return piece.id;
  }

  // 2. Priority: Get into the victory path (end game)
  const pieceEnteringHome = movablePieces.find(p => {
    const nextPos = calculateNextPosition(p, diceValue);
    return nextPos >= GAME_RULES.HOME_PATH_START && p.position < GAME_RULES.HOME_PATH_START;
  });
  if (pieceEnteringHome) return pieceEnteringHome.id;

  // 3. Priority: Exit base with a 6
  if (diceValue === GAME_RULES.EXIT_BASE_DICE_VALUE) {
    const basePiece = movablePieces.find(p => p.position === GAME_RULES.BASE_POSITION);
    if (basePiece) return basePiece.id;
  }

  // 4. Priority: Move pieces that are currently in danger (opponent within 1-6 steps behind)
  // Simple check for pieces on the circuit
  const vulnerablePiece = movablePieces.find(p => {
    if (p.position < 0 || p.position >= GAME_RULES.BOARD_CIRCUIT_SIZE) return false;
    const globalPos = getGlobalPosition(p.color, p.position);
    if (globalPos === null) return false;

    return allPlayers.some(opp => {
      // Don't fear yourself or teammates
      if (opp.id === player.id || (player.teamId && opp.teamId === player.teamId)) return false;
      return opp.pieces.some(oppPc => {
        if (oppPc.position < 0 || oppPc.position >= GAME_RULES.BOARD_CIRCUIT_SIZE) return false;
        const oppGlobal = getGlobalPosition(oppPc.color, oppPc.position);
        if (oppGlobal === null) return false;
        
        // Is opponent 1-6 steps behind?
        const dist = (globalPos - oppGlobal + 52) % 52;
        return dist > 0 && dist <= 6;
      });
    });
  });
  if (vulnerablePiece) return vulnerablePiece.id;

  // 5. Priority: Move to a safe spot
  const safeMove = movablePieces.find(p => {
    const nextPos = calculateNextPosition(p, diceValue);
    return isSafeTile(p.color, nextPos);
  });
  if (safeMove) return safeMove.id;

  // 6. Default: Advance the piece closest to Home
  return movablePieces.sort((a, b) => b.position - a.position)[0].id;
}

/**
 * Fetches the best move for an AI player based on a randomized personality.
 * Includes a robust heuristic fallback for when the API is exhausted.
 */
export async function getBestMove(
  player: Player,
  diceValue: number,
  allPlayers: Player[]
): Promise<string | null> {
  const ids: PersonalityId[] = ['WARLORD', 'TURTLE', 'GRANDMASTER'];
  const personality = PERSONALITIES[ids[Math.floor(Math.random() * ids.length)]];

  const prompt = PROMPT_TEMPLATES.MOVE_DECISION(
    personality,
    diceValue,
    JSON.stringify(player.pieces),
    JSON.stringify(allPlayers.filter(p => p.id !== player.id))
  );

  const result = await callGeminiWithRetry(prompt, { 
    temperature: 0.1, // Lower temperature for more deterministic AI choice
    topP: 0.8,
    maxOutputTokens: 20
  });

  if (result) {
    // Validate Gemini's response
    const validIdMatch = player.pieces.find(p => p.id === result && canPieceMove(p, diceValue));
    if (validIdMatch) return validIdMatch.id;
    
    // Sometimes Gemini adds extra text, try to extract the ID from the string
    const extractedId = player.pieces.find(p => result.includes(p.id) && canPieceMove(p, diceValue));
    if (extractedId) return extractedId.id;
  }

  // Fallback to our robust strategic heuristic
  return getHeuristicMove(player, diceValue, allPlayers);
}

/**
 * Provides high-level strategic advice to the human player.
 */
export async function getStrategicAdvice(
  player: Player,
  allPlayers: Player[]
): Promise<string> {
  const prompt = PROMPT_TEMPLATES.ORACLE_ADVICE(
    JSON.stringify(player.pieces),
    JSON.stringify(allPlayers.filter(p => p.id !== player.id))
  );

  const result = await callGeminiWithRetry(prompt, { 
    temperature: 0.7, 
    maxOutputTokens: 50
  }, 2, 500); // Shorter retries for advice

  return result || "The stars are silent. Trust in your dice.";
}
