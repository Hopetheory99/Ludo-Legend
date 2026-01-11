
export const GAME_RULES = {
  // Board circuit size (main loop)
  BOARD_CIRCUIT_SIZE: 52,
  
  // Local position relative to each player's start
  START_POSITION: 0,
  
  // Position in yard/base
  BASE_POSITION: -1,
  
  // The point where a piece enters the private home path
  HOME_PATH_START: 52,
  
  // The threshold to enter the home path is after 51 steps (the 52nd step is index 52)
  CIRCUIT_COMPLETION_STEPS: 51,
  
  // The absolute win condition
  VICTORY_POSITION: 100,
  
  // Max possible position (51 board steps + 6 home path steps)
  MAX_POSITION: 57,
  
  // Dice value needed to exit base
  EXIT_BASE_DICE_VALUE: 6,
  
  // Turn timer in seconds
  TURN_TIME_LIMIT: 15,
};
