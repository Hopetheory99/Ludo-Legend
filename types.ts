
export type PlayerColor = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';

export interface Piece {
  id: string;
  color: PlayerColor;
  position: number; // -1 = home, 0-51 = board paths, 52-57 = victory path, 100 = finished
}

export type GameMode = 'CLASSIC' | 'TEAM' | 'QUICK';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  color: PlayerColor;
  teamId?: string; // For Team Mode (e.g., "TEAM_A", "TEAM_B")
  isAI: boolean;
  pieces: Piece[];
  languagePreference: 'en' | 'bn' | 'hi' | 'es';
}

export type GameState = 'LOBBY' | 'ROLLING' | 'MOVING' | 'PROCESSING' | 'WON';

export type AppView = 'AUTH' | 'MAIN_MENU' | 'FRIENDS' | 'PROFILE' | 'GAME';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  matchesWon: number;
  matchesPlayed: number;
  currentWinStreak: number;
  maxWinStreak: number;
  isSocialLinked: boolean;
  provider: 'google' | 'facebook' | 'guest' | null;
}

export interface GameEvent {
  id: string;
  type: 'ROLL' | 'CAPTURE' | 'HOME' | 'VICTORY' | 'TURN';
  message: string;
  color: PlayerColor;
  timestamp: number;
}

export interface Friend {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game';
  level: number;
}
