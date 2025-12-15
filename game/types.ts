export enum GameState {
  MENU,
  PLAYING,
  GAME_OVER,
  HANGAR,
  LEADERBOARD
}

export enum GameMode {
  FREE = 'FREE',
  COMPETITIVE = 'COMPETITIVE'
}

export interface ShipNFT {
  objectId: string;
  spriteId: number;
  colorBase: Array<number>;
  colorShadow: Array<number>;
  life: number;
  attack: number;
  status: 'ALIVE' | 'DESTROYED' | 'TRADE';
}

export interface ShipConfig {
  id: number;
  colorBase: string;
  colorShadow: string;
  projectileColor: string;
  explosionColor: string;
  life: number;
  attack: number;
  spriteUrl?: string;
  hpBonus: number;
  damageMultiplier: number;
  speedMultiplier: number;
  fireRateMultiplier: number;
}

export enum EventType {
  NONE = 'NONE',
  METEOR_RAIN = 'METEOR RAIN',
  ENEMY_FRENZY = 'ENEMY FRENZY',
  POWERUP_TIDE = 'POWER-UP TIDE',
  BULLET_HELL = 'BULLET HELL',
  MINI_BOSSES = 'MINI BOSS INVASION'
}

export enum PowerUpType {
  HEALTH = 'HEALTH',
  SHIELD = 'SHIELD',
  TRIPLE_SHOT = 'TRIPLE_SHOT',
  NUKE = 'NUKE',
  COIN = 'COIN'
}

export interface SaveData {
  coins: number;
  highScore: number;
  maxCombo: number;
  totalKills: number;
  maxTimeSurvived: number; // in seconds
}

export interface GameStats {
  score: number;
  combo: number;
  health: number;
  time: number; // seconds
  difficulty: number; // 1-5 stars
  activeEvent: EventType;
  coinsCollected: number;
}