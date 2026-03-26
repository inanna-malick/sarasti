/**
 * Ring signal metadata — shared between HudRings3D, SignalReadout, and compositor.
 * Single source of truth for colors, formulas, and pole labels.
 */

export interface RingMeta {
  key: 'tension' | 'valence' | 'stature';
  label: string;         // single char: T, V, S
  poles: [string, string]; // [negative, positive]
  negativeColor: string;
  positiveColor: string;
  formula: string;
  steepness: string;
  /** Keys into CircumplexDebug.zScores that feed this ring */
  zScoreKeys: string[];
}

export const RING_META: RingMeta[] = [
  {
    key: 'tension',
    label: 'T',
    poles: ['calm', 'tense'],
    negativeColor: 'rgb(38, 139, 210)',   // sol.blue
    positiveColor: 'rgb(203, 75, 22)',    // sol.orange
    formula: 'vol_z\u00d7|vel_z| + |dd_z| \u2212 0.8',
    steepness: 'k=1.0',
    zScoreKeys: ['vol_z', 'vel_z', 'dd_z'],
  },
  {
    key: 'valence',
    label: 'V',
    poles: ['bad', 'good'],
    negativeColor: 'rgb(108, 113, 196)',  // sol.violet
    positiveColor: 'rgb(211, 54, 130)',   // sol.magenta
    formula: 'dev_z + 0.5\u00d7mom_z',
    steepness: 'k=1.5',
    zScoreKeys: ['dev_z', 'mom_z'],
  },
  {
    key: 'stature',
    label: 'S',
    poles: ['sprite', 'titan'],
    negativeColor: 'rgb(147, 161, 161)',  // sol.base1
    positiveColor: 'rgb(42, 161, 152)',   // sol.cyan
    formula: 'mom_z + |mr_z| \u2212 0.3',
    steepness: 'k=1.0',
    zScoreKeys: ['mom_z', 'mr_z'],
  },
];
