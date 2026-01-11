
import { Player, Piece, PlayerColor, GameMode } from '../types';
import { PLAYER_OFFSETS, isSafeTile } from './geometryService';
import { GAME_RULES } from '../constants/gameRules';

/**
 * Maps a player's local piece position (0-51) to the global board path index.
 */
export function getGlobalPosition(color: PlayerColor, localPos: number): number | null {
  // Global positions are only valid for pieces on the circuit
  if (localPos < 0 || localPos >= GAME_RULES.BOARD_CIRCUIT_SIZE) return null;
  
  // Use modulo to wrap around the 52-tile circuit
  return (localPos + PLAYER_OFFSETS[color]) % GAME_RULES.BOARD_CIRCUIT_SIZE;
}

/**
 * Checks if all pieces of a player have reached the victory position.
 */
export function isPlayerFinished(player: Player): boolean {
  return player.pieces.every(p => p.position === GAME_RULES.VICTORY_POSITION);
}

/**
 * Pure function to calculate the next position based on dice value.
 * Standard Ludo: A 6 exits the base to index 0.
 */
export function calculateNextPosition(piece: Piece, diceVal: number): number {
  if (piece.position === GAME_RULES.VICTORY_POSITION) return GAME_RULES.VICTORY_POSITION;

  // Case: Exiting Base (Yard)
  if (piece.position === GAME_RULES.BASE_POSITION) {
    if (diceVal === GAME_RULES.EXIT_BASE_DICE_VALUE) {
      // Must go to exactly 0 (The start tile)
      return GAME_RULES.START_POSITION; 
    }
    return GAME_RULES.BASE_POSITION;
  }

  const nextPos = piece.position + diceVal;

  // Case: Reaching/Exceeding Victory threshold (100)
  // Max local index on path is 57 (after 51 circuit steps + 6 home path steps)
  if (nextPos >= GAME_RULES.MAX_POSITION) {
    return GAME_RULES.VICTORY_POSITION;
  }

  return nextPos;
}

/**
 * Pure function to find if any opponent pieces are captured at the landing position.
 * Respects Team boundaries (Teammates cannot capture each other).
 */
export function findCaptures(
  movingPiece: Piece,
  nextLocalPos: number,
  allPlayers: Player[]
): { playerId: string; pieceId: string }[] {
  // Captures only happen on the main circuit (0-51)
  if (
    nextLocalPos < 0 || 
    nextLocalPos >= GAME_RULES.BOARD_CIRCUIT_SIZE || 
    isSafeTile(movingPiece.color, nextLocalPos)
  ) {
    return [];
  }

  const movingPlayer = allPlayers.find(p => p.pieces.some(pc => pc.id === movingPiece.id));
  const movingGlobalPos = getGlobalPosition(movingPiece.color, nextLocalPos);
  const captures: { playerId: string; pieceId: string }[] = [];

  allPlayers.forEach(player => {
    // Cannot capture yourself or teammates
    if (player.id === movingPlayer?.id) return;
    if (movingPlayer?.teamId && player.teamId === movingPlayer.teamId) return;

    player.pieces.forEach(oppPiece => {
      // Opponent must be on the circuit to be captured
      if (oppPiece.position >= 0 && oppPiece.position < GAME_RULES.BOARD_CIRCUIT_SIZE) {
        const oppGlobalPos = getGlobalPosition(oppPiece.color, oppPiece.position);
        if (oppGlobalPos === movingGlobalPos) {
          captures.push({ playerId: player.id, pieceId: oppPiece.id });
        }
      }
    });
  });

  return captures;
}

/**
 * Checks if a piece can legally move by the given dice value.
 */
export function canPieceMove(piece: Piece, diceVal: number | null): boolean {
  if (diceVal === null) return false;
  if (piece.position === GAME_RULES.VICTORY_POSITION) return false;
  
  if (piece.position === GAME_RULES.BASE_POSITION) {
    return diceVal === GAME_RULES.EXIT_BASE_DICE_VALUE;
  }
  
  // Logic allows pieces to move if they haven't yet reached home.
  // In this edition, rolls that meet or exceed the end path count as reaching victory.
  return piece.position < GAME_RULES.MAX_POSITION;
}

/**
 * Validates if the current player is allowed to move a specific piece.
 * In TEAM mode, if a player is finished, they can move their teammate's pieces.
 */
export function canPlayerMovePiece(activePlayer: Player, piece: Piece, players: Player[], gameMode: GameMode): boolean {
  if (piece.color === activePlayer.color) return true;
  
  if (gameMode === 'TEAM' && activePlayer.teamId && isPlayerFinished(activePlayer)) {
    const teammate = players.find(p => p.teamId === activePlayer.teamId && p.id !== activePlayer.id);
    return teammate?.id === players.find(p => p.pieces.some(pc => pc.id === piece.id))?.id;
  }
  
  return false;
}

/**
 * Determines if a player or their team has met the victory conditions.
 */
export function checkVictoryCondition(player: Player, allPlayers: Player[], gameMode: GameMode): boolean {
  if (gameMode === 'TEAM' && player.teamId) {
    const teamPlayers = allPlayers.filter(p => p.teamId === player.teamId);
    return teamPlayers.every(tp => tp.pieces.every(pc => pc.position === GAME_RULES.VICTORY_POSITION));
  }
  
  return player.pieces.every(p => p.position === GAME_RULES.VICTORY_POSITION);
}
