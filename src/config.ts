/** Global tuning constants. All distances are in virtual pixels, times in seconds. */
export const WORLD = {
  width: 320,
  height: 180,
  groundY: 166,
  gravity: 140,
} as const;

export const TURRET = {
  y: 160,
  minX: 12,
  maxX: 308,
  speed: 95,
  barrelLength: 15,
  fireCooldown: 0.1,
  rocketCooldown: 0.6,
  bulletSpeed: 280,
  startAmmo: 150,
  maxAmmo: 300,
  startRockets: 3,
  maxRockets: 3,
  /** Barrel can't aim lower than this angle above the horizon (radians). */
  minElevation: 0.08,
  pickupRadius: 10,
} as const;

export const ROCKET = {
  startSpeed: 70,
  maxSpeed: 210,
  acceleration: 260,
  turnRate: 5,
  lifetime: 3.2,
  blastRadius: 26,
  hitRadius: 5,
} as const;

export interface DroneSpec {
  hp: number;
  radius: number;
  cruiseSpeed: number;
  diveSpeed: number;
  damage: number;
  score: number;
}

export const DRONES = {
  quad: { hp: 1, radius: 5, cruiseSpeed: 32, diveSpeed: 55, damage: 6, score: 10 },
  wing: { hp: 3, radius: 7, cruiseSpeed: 62, diveSpeed: 95, damage: 12, score: 25 },
} as const satisfies Record<string, DroneSpec>;

export type DroneKind = keyof typeof DRONES;

export const SPAWNER = {
  initialInterval: 2.4,
  minInterval: 0.55,
  /** Seconds until the spawn interval reaches its minimum. */
  rampTime: 180,
  wingChanceStart: 0.1,
  wingChanceMax: 0.45,
  minAltitude: 18,
  maxAltitude: 78,
} as const;

export const PICKUPS = {
  ammoChance: 0.35,
  rocketChance: 0.08,
  ammoAmount: 50,
  fallSpeed: 22,
  groundTtl: 7,
  blinkTime: 2,
} as const;

export const REFINERY = {
  maxHp: 100,
  maxFires: 14,
} as const;

export const COLLAPSE = {
  lidLaunchSpeed: 190,
  lidSpin: 7,
  /** Pause after the lid lands before the game-over screen. */
  afterLandDelay: 1.6,
} as const;
