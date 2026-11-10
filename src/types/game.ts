export type HeroRole = 'tank' | 'dps' | 'support';

export interface HeroData {
  id: string;
  name: string;
  actorName: string;
  role: HeroRole;
  title: string;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number; // percentage
  critMultiplier: number;
  primarySkill: string;
  stance: 'aggressive' | 'defensive' | 'cinematic';
  color: string;
  accentColor: string;
  equippedWeapon: string;
  availableWeapons: { id: string; name: string; atkBonus: number; critBonus: number; desc: string }[];
}

export interface BossData {
  id: string;
  name: string;
  title: string;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  color: string;
  specialMove: string;
  enraged: boolean;
}

export type DirectorStyle = 'zack_snyder' | 'michael_bay' | 'john_wick' | 'christopher_nolan';

export interface MovieScene {
  id: string;
  sceneNumber: number;
  title: string;
  environment: 'cyberpunk' | 'colosseum' | 'foundry';
  targetAudience: string;
  budgetReward: number;
  boss: BossData;
}

export type CameraPreset = 'director_auto' | 'wide_intro' | 'boss_attack' | 'tank_block' | 'dps_action' | 'close_climax' | 'orbit_drone';

export interface CombatAction {
  sourceId: string;
  targetId: string;
  type: 'attack' | 'block' | 'skill' | 'boss_slam' | 'finisher' | 'heal';
  damage: number;
  isCrit: boolean;
  message: string;
  slowMoDuration?: number;
}

export type GameState = 'title' | 'studio_prep' | 'battle' | 'director_cut' | 'game_over';
