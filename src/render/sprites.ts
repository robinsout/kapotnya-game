import { COLORS } from './palette';
import type { Palette, Sprite } from './sprite';
import { flipX, parseSprite } from './sprite';

const P: Palette = {
  k: COLORS.droneBody,
  l: COLORS.droneLight,
  r: COLORS.red,
  p: COLORS.steelLight,
  w: COLORS.white,
  y: COLORS.yellow,
  g: COLORS.olive,
  G: COLORS.oliveLight,
  d: COLORS.oliveDark,
  b: COLORS.rubber,
  s: COLORS.steel,
  S: COLORS.steelDark,
  c: COLORS.canopy,
  C: COLORS.canopyStripe,
  a: COLORS.crateAmmo,
  m: COLORS.crateRocket,
  o: COLORS.orange,
};

const sprite = (rows: string[]): Sprite => parseSprite(rows, P);

/** Quadcopter, two propeller frames. */
export const QUAD_FRAMES: readonly Sprite[] = [
  sprite([
    'ppp.....ppp',
    '..k.....k..',
    '.lkkkkkkkl.',
    '...kkrkk...',
    '....kkk....',
    '....k.k....',
  ]),
  sprite([
    '.p.......p.',
    '..k.....k..',
    '.lkkkkkkkl.',
    '...kkkkk...',
    '....kkk....',
    '....k.k....',
  ]),
];

/** Delta-wing kamikaze drone flying right; two propeller frames. */
const WING_RIGHT: readonly Sprite[] = [
  sprite([
    'kk...........',
    'lkkk.........',
    '.lkkkkk......',
    '..kkkkkkkkk..',
    'pkkkkkkkkkkkw',
    '..kkkkkkkkk..',
    '.lkkkkk......',
    'lkkk.........',
    'kk...........',
  ]),
  sprite([
    'kk...........',
    'lkkk.........',
    '.lkkkkk......',
    'p.kkkkkkkkk..',
    '.kkkkkkkkkkkr',
    'p.kkkkkkkkk..',
    '.lkkkkk......',
    'lkkk.........',
    'kk...........',
  ]),
];

export const WING_FRAMES = {
  right: WING_RIGHT,
  left: WING_RIGHT.map(flipX),
} as const;

export const PARACHUTE = sprite([
  '...ccccc...',
  '.cCcCcCcCc.',
  'cCcCcCcCcCc',
  's.........s',
  '.s.......s.',
  '..s.....s..',
  '...s...s...',
]);

export const AMMO_CRATE = sprite([
  'ddddd',
  'ayaya',
  'aaaaa',
  'ddddd',
]);

export const ROCKET_CRATE = sprite([
  'SSSSS',
  'mwwwm',
  'mmmmm',
  'SSSSS',
]);

/** Anti-aircraft gun carriage; the barrels are drawn separately as lines. */
export const TURRET_BASE = sprite([
  '......GGGGGGG......',
  '.....GgggggggG.....',
  '....GgggdddgggG....',
  '...dgggggggggggd...',
  '..GGGGGGGGGGGGGGG..',
  '.GgggggggggggggggG.',
  'ddddddddddddddddddd',
  '..s.............s..',
  '.bbb...........bbb.',
  'bbsbb.........bbsbb',
  'bbbbb.........bbbbb',
  '.bbb...........bbb.',
]);

/** Rocket icon used for in-flight missiles (pointing right). */
export const ROCKET = sprite([
  'S.....',
  'Swwwwr',
  'S.....',
]);
