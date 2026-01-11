
import { PlayerColor, Piece } from '../types';
import { GAME_RULES } from '../constants/gameRules';

/**
 * GENERATIVE GEOMETRY: The board is a 15x15 grid.
 * We define the main 52-tile circuit starting from RED's start tile [6,1].
 * Each arm consists of 13 tiles (12 path + 1 pivot).
 */
export const MAIN_PATH_COORDS = [
  // ARM 1 (Indices 0-12) - RED TERRITORY
  [6,1], [6,2], [6,3], [6,4], [6,5], [5,6], [4,6], [3,6], [2,6], [1,6], [0,6], [0,7], [0,8],
  // ARM 2 (Indices 13-25) - BLUE TERRITORY
  [1,8], [2,8], [3,8], [4,8], [5,8], [6,9], [6,10], [6,11], [6,12], [6,13], [6,14], [7,14], [8,14],
  // ARM 3 (Indices 26-38) - YELLOW TERRITORY
  [8,13], [8,12], [8,11], [8,10], [8,9], [9,8], [10,8], [11,8], [12,8], [13,8], [14,8], [14,7], [14,6],
  // ARM 4 (Indices 39-51) - GREEN TERRITORY
  [13,6], [12,6], [11,6], [10,6], [9,6], [8,5], [8,4], [8,3], [8,2], [8,1], [8,0], [7,0], [6,0]
];

/**
 * Local position 0 maps to these global indices in the MAIN_PATH_COORDS array.
 */
export const PLAYER_OFFSETS: Record<PlayerColor, number> = {
  RED: 0,    
  BLUE: 13,  
  YELLOW: 26, 
  GREEN: 39  
};

/**
 * Safe spots in global circuit indices.
 */
export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

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
  
  // 1. Check if piece is in Base/Yard
  if (position === GAME_RULES.BASE_POSITION) {
    const pieceIndex = (parseInt(id.split('-')[1]) || 1) - 1;
    const coords = BASE_POSITIONS[color][pieceIndex];
    return { r: coords[0], c: coords[1] };
  }
  
  // 2. Check if piece is in Private Home Path (steps 52-57)
  if (position >= GAME_RULES.HOME_PATH_START && position < GAME_RULES.VICTORY_POSITION) {
    const homeIdx = position - GAME_RULES.HOME_PATH_START;
    const coords = HOME_PATHS[color][homeIdx] || [7, 7];
    return { r: coords[0], c: coords[1] };
  }
  
  // 3. Check if piece has reached Victory
  if (position === GAME_RULES.VICTORY_POSITION) return { r: 7, c: 7 };
  
  // 4. Circuit Mapping (Steps 0-51)
  // Ensure we normalize the global index correctly.
  const offset = PLAYER_OFFSETS[color];
  const globalIndex = (position + offset) % GAME_RULES.BOARD_CIRCUIT_SIZE;
  
  // Safety fallback for out-of-bounds mapping
  const coords = MAIN_PATH_COORDS[globalIndex];
  return coords ? { r: coords[0], c: coords[1] } : { r: 7, c: 7 };
}

export function isSafeTile(color: PlayerColor, position: number): boolean {
  if (position < 0 || position >= GAME_RULES.BOARD_CIRCUIT_SIZE) return false;
  const globalPos = (position + PLAYER_OFFSETS[color]) % GAME_RULES.BOARD_CIRCUIT_SIZE;
  return SAFE_POSITIONS.includes(globalPos);
}
