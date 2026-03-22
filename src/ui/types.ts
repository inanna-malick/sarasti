export interface RingSignal {
  name: string;
  value: number;          // [-1, 1] bipolar
  negativeColor: string;
  positiveColor: string;
  minOpacity?: number;    // at zero magnitude (default 0.12)
  maxOpacity?: number;    // at full magnitude (default 0.45)
}

export interface HudLabel {
  text: string;
  color: string;
  accentColor?: string;   // colored bar under label
}

export interface HudAnnotation {
  text: string;
  angleDeg: number;       // polar position on ring
  ringIndex?: number;     // which ring to anchor to
  color: string;
  fontSize?: number;
  align?: 'left' | 'right'; // text flow direction from anchor
}

export interface HudTheme {
  labelColor: string;
  labelShadow?: string;
  fontFamily?: string;
}

export interface HudSizing {
  outerRadius?: number;   // default 56
  strokeWidth?: number;   // default 1
  ringGap?: number;       // default 6
}
