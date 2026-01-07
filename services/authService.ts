
import { User, Friend } from "../types";

const STORAGE_KEY = 'ludo_legend_user';

export const AVATAR_SEEDS = [
  'Felix', 'Aneka', 'Caleb', 'Buddy', 'Lucky', 
  'Max', 'Milo', 'Oliver', 'Shadow', 'Tiger',
  'Jasper', 'Cookie', 'Buster', 'Coco', 'Angel'
];

export const getAvatarUrl = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

export const MOCK_FRIENDS: Friend[] = [
  { id: 'f1', username: 'ShadowSlayer', avatar: getAvatarUrl('Shadow'), status: 'online', level: 42 },
  { id: 'f2', username: 'LudoQueen', avatar: getAvatarUrl('Angel'), status: 'in-game', level: 38 },
  { id: 'f3', username: 'DiceMaster99', avatar: getAvatarUrl('Jasper'), status: 'offline', level: 12 },
  { id: 'f4', username: 'NeonNinja', avatar: getAvatarUrl('Tiger'), status: 'online', level: 55 },
];

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async loginWithSocial(provider: 'google' | 'facebook'): Promise<User> {
    await new Promise(r => setTimeout(r, 1500));
    
    const seed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      username: provider === 'google' ? 'Google Legend' : 'FB Warrior',
      email: `${provider}@example.com`,
      avatar: getAvatarUrl(seed),
      level: 1,
      xp: 0,
      matchesWon: 0,
      matchesPlayed: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      isSocialLinked: true,
      provider
    };

    this.saveUser(newUser);
    return newUser;
  }

  async loginAsGuest(): Promise<User> {
    const guestUser: User = {
      id: 'guest_' + Math.random().toString(36).substring(7),
      username: 'Guest Explorer',
      email: 'guest@ludo.local',
      avatar: getAvatarUrl('Felix'),
      level: 1,
      xp: 0,
      matchesWon: 0,
      matchesPlayed: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      isSocialLinked: false,
      provider: 'guest'
    };
    this.saveUser(guestUser);
    return guestUser;
  }

  recordMatchResult(won: boolean): User {
    if (!this.currentUser) throw new Error("No user logged in");
    
    const played = this.currentUser.matchesPlayed + 1;
    const wins = won ? this.currentUser.matchesWon + 1 : this.currentUser.matchesWon;
    const streak = won ? this.currentUser.currentWinStreak + 1 : 0;
    const maxStreak = Math.max(this.currentUser.maxWinStreak, streak);
    const xp = won ? this.currentUser.xp + 250 : this.currentUser.xp + 50;
    
    // Simple level up logic
    const level = Math.floor(xp / 1000) + 1;

    const updated: User = {
      ...this.currentUser,
      matchesPlayed: played,
      matchesWon: wins,
      currentWinStreak: streak,
      maxWinStreak: maxStreak,
      xp: xp,
      level: level
    };

    this.saveUser(updated);
    return updated;
  }

  updateProfile(updates: Partial<User>): User {
    if (!this.currentUser) throw new Error("No user logged in");
    this.currentUser = { ...this.currentUser, ...updates };
    this.saveUser(this.currentUser);
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  private saveUser(user: User) {
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}

export const authService = new AuthService();
