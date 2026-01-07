
import { GoogleGenAI } from "@google/genai";
import { Player, Piece } from "../types";
import { PERSONALITIES, PROMPT_TEMPLATES, PersonalityId } from "../constants/aiConfig";
import { canPieceMove } from "./ruleService";

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
 * Fetches the best move for an AI player based on a randomized personality.
 * Includes a deterministic fallback for when the API is exhausted.
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
    temperature: 0.2, 
    topP: 0.8,
    maxOutputTokens: 20
  });

  if (result) {
    const validIdMatch = player.pieces.find(p => p.id === result && canPieceMove(p, diceValue));
    if (validIdMatch) return validIdMatch.id;
  }

  // Deterministic Fallback Logic (if AI fails or returns invalid move)
  const movablePieces = player.pieces.filter(p => canPieceMove(p, diceValue));
  if (movablePieces.length === 0) return null;

  // Strategic Fallback: 
  // 1. Move a piece out of home if possible
  const homePiece = movablePieces.find(p => p.position === -1);
  if (homePiece && diceValue === 6) return homePiece.id;

  // 2. Move the piece closest to home (to get it to victory)
  return movablePieces.sort((a, b) => b.position - a.position)[0].id;
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
