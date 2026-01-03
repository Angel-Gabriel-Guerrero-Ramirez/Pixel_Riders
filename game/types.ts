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

export enum CheckpointAction {
  CONTINUE = 'CONTINUE',
  SAVE_AND_QUIT = 'SAVE_AND_QUIT'
}
export interface CheckpointData {
  score: number;
  combo: number;
  health: number;
  time: number;
  difficulty: number;
  activeEvent: EventType;
  coinsCollected: number;
  checkpointTime: number; // Tiempo específico del checkpoint (ej: 300, 600, 900 segundos)
}

export interface CheckpointStats {
  reachedCheckpoint: boolean;
  checkpointTime: number;
  canContinue: boolean;
}

export interface CheckpointResult {
  action: CheckpointAction;
  score?: number;
  combo?: number;
  checkpointTime?: number;
}

export interface HangarShip {
  tokenId: number;
  owner: string;
  spriteId: number;
  colorBase: Array<number>;
  colorShadow: Array<number>;
  life: number;
  attack: number;
  status: string;
  spriteDataUrl?: string;
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

export interface LeaderboardStats  {
  rank: number;
  address: string;
  score: number;
  combo: number;
  timestamp: string;
  game_mode: 'FREE' | 'COMPETITIVE';
}