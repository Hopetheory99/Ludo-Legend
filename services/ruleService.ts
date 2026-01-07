
import { Player, Piece, PlayerColor } from '../types';
import { SAFE_POSITIONS, PLAYER_OFFSETS } from './geometryService';

export function getGlobalPosition(color: PlayerColor, localPos: number): number | null {
  if (localPos < 0 || localPos >= 52) return null;
  return (localPos + PLAYER_OFFSETS[color]) % 52;
}

export function canPieceMove(piece: Piece, diceVal: number | null): boolean {
  if (!diceVal) return false;
  if (piece.position === 100) return false;
  if (piece.position === -1) return diceVal === 6;
  if (piece.position + diceVal > 57) return false;
  return true;
}

export function checkVictoryCondition(player: Player, allPlayers: Player[], gameMode: string): boolean {
  if (gameMode === 'TEAM' && player.teamId) {
    const teamPlayers = allPlayers.filter(p => p.teamId === player.teamId);
    return teamPlayers.every(tp => tp.pieces.every(pc => pc.position === 100));
  }
  return player.pieces.every(p => p.position === 100);
}
