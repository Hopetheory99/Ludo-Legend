
import { PlayerColor, Piece } from '../types';

/**
 * UNIVERSAL BOARD PATH (52 TILES)
 * This path starts at the Red Arm Corner [6,0] and follows a clockwise loop.
 */
export const MAIN_PATH_COORDS = [
  // Red side quadrant entrance to Blue entrance
  [6,0],[6,1],[6,2],[6,3],[6,4],[6,5], // Red start tile is at index 1
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],

  // Blue side quadrant entrance to Yellow entrance
  [0,8],[1,8],[2,8],[3,8],[4,8],[5,8], // Blue start tile is at index 14
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],

  // Yellow side quadrant entrance to Green entrance
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9], // Yellow start tile is at index 27
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],

  // Green side quadrant entrance back to Red entrance
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6], // Green start tile is at index 40
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0]
];

// Offsets point to the Colored Start Tile for each player
export const PLAYER_OFFSETS: Record<PlayerColor, number> = {
  RED: 1,
  BLUE: 14,
  YELLOW: 27,
  GREEN: 40
};

// Safe spots relative to the global path index
export const SAFE_POSITIONS = [1, 9, 14, 22, 27, 35, 40, 48];

export const BASE_POSITIONS: Record<PlayerColor, number[][]> = {
  RED: [[1, 1], [1, 4], [4, 1], [4, 4]],
  BLUE: [[1, 10], [1, 13], [4, 10], [4, 13]],
  YELLOW: [[10, 10], [10, 13], [13, 10], [13, 13]],
  GREEN: [[10, 1], [10, 4], [13, 1], [13, 4]],
};

export const HOME_PATHS: Record<PlayerColor, number[][]> = {
  RED: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  BLUE: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  YELLOW: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  GREEN: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

export function getTileCoord(pc: Piece): { r: number; c: number } {
  const { color, position, id } = pc;
  
  if (position === -1) {
    const pieceIndex = parseInt(id.split('-')[1]) - 1;
    const coords = BASE_POSITIONS[color][pieceIndex];
    return { r: coords[0], c: coords[1] };
  }
  
  if (position >= 52 && position < 100) {
    const coords = HOME_PATHS[color][position - 52] || [7, 7];
    return { r: coords[0], c: coords[1] };
  }
  
  if (position === 100) return { r: 7, c: 7 };
  
  const globalIndex = (position + PLAYER_OFFSETS[color]) % 52;
  const coords = MAIN_PATH_COORDS[globalIndex];
  
  if (!coords) return { r: 7, c: 7 };
  
  return { r: coords[0], c: coords[1] };
}

export function isSafeTile(color: PlayerColor, position: number): boolean {
  if (position < 0 || position >= 52) return false;
  const globalPos = (position + PLAYER_OFFSETS[color]) % 52;
  return SAFE_POSITIONS.includes(globalPos);
}
