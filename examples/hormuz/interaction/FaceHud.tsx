import React from 'react';
import type { FaceInstance, AssetClass } from '../../../src/types';
import { useStore } from '../../../src/store';
import { sol, theme } from '../theme';

const CLASS_COLORS: Record<AssetClass, string> = {
  energy: sol.orange,
  equity: sol.blue,
  fear: sol.red,
  currency: sol.violet,
  commodity: sol.green,
  media: sol.magenta,
};

// Ring radii — 3 concentric, non-overlapping with neighbors at 120px spacing
const RING_OUTER = 56;   // deviation (headline)
const RING_MID = 50;     // tension (arousal)
const RING_INNER = 44;   // valence (good/bad)
const RING_GAP = 6;      // visual separation

const DEV_ANGLE_DEG = 330;

function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: radius * Math.cos(rad), y: -radius * Math.sin(rad) };
}

/** Clamp to [-1, 1] */
function clamp1(x: number): number {
  return Math.max(-1, Math.min(1, x));
}

/**
 * Map a signed value in [-1, 1] to a desaturated color between two poles.
 * Returns an rgba string with low opacity for subtlety.
 */
function signalColor(value: number, negative: string, positive: string, baseOpacity: number): string {
  const mag = Math.abs(value);
  // At low magnitude, fade toward the muted base color
  const opacity = 0.12 + mag * (baseOpacity - 0.12);
  return value >= 0
    ? positive.replace(')', `, ${opacity.toFixed(2)})`)
    : negative.replace(')', `, ${opacity.toFixed(2)})`);
}

// Pre-computed rgba base strings (without alpha)
const RED_RGB = 'rgba(220, 50, 47';    // sol.red desaturated
const GREEN_RGB = 'rgba(133, 153, 0';  // sol.green desaturated
const WARM_RGB = 'rgba(181, 137, 0';   // sol.yellow — tense/warm
const COOL_RGB = 'rgba(42, 161, 152';  // sol.cyan — calm/cool

/**
 * HUD rendered around each face.
 *
 * 3 concentric stroke rings encoding binding inputs:
 *   Inner: Valence (green = good position, red = bad)
 *   Middle: Tension (warm = tense/volatile, cool = calm)
 *   Outer: Deviation headline (green = positive, red = negative)
 *
 * Selected face: outer ring brightens to cyan.
 * All rings are thin strokes — no fill, no colored-light bleed.
 */
export function FaceHud({ instance }: { instance: FaceInstance }) {
  const selectedId = useStore((s) => s.selectedId);
  const { ticker, frame } = instance;
  const devPercent = (frame.deviation * 100).toFixed(1);
  const devSign = frame.deviation >= 0 ? '+' : '';
  const devColor = frame.deviation >= 0 ? sol.green : sol.red;
  const classColor = CLASS_COLORS[ticker.class] || sol.base0;
  const isSelected = selectedId === instance.id;

  // Simplified binding inputs (raw frame values, not z-scored — directionally correct)
  const valenceRaw = clamp1(frame.deviation + 0.5 * frame.momentum);
  const tensionRaw = clamp1(frame.volatility * Math.abs(frame.velocity) - 0.3);
  const deviationSign = clamp1(frame.deviation * 3); // amplify for visibility

  // Ring colors — desaturated, low opacity, signal-driven
  const valenceColor = signalColor(valenceRaw, RED_RGB, GREEN_RGB, 0.45);
  const tensionColor = signalColor(tensionRaw, COOL_RGB, WARM_RGB, 0.40);
  const deviationColor = isSelected
    ? `rgba(42, 161, 152, 0.55)` // cyan for selected
    : signalColor(deviationSign, RED_RGB, GREEN_RGB, 0.35);

  const devPos = polarToXY(DEV_ANGLE_DEG, RING_OUTER);

  const ringStyle = (radius: number, color: string): React.CSSProperties => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: radius * 2,
    height: radius * 2,
    borderRadius: '50%',
    border: `1px solid ${color}`,
    pointerEvents: 'none',
  });

  return (
    <div
      style={{
        position: 'relative',
        width: 0,
        height: 0,
        fontFamily: 'monospace',
        fontSize: 9,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        opacity: 0.75,
      }}
    >
      {/* Inner: Valence */}
      <div style={ringStyle(RING_INNER, valenceColor)} />
      {/* Middle: Tension */}
      <div style={ringStyle(RING_MID, tensionColor)} />
      {/* Outer: Deviation headline */}
      <div style={ringStyle(RING_OUTER, deviationColor)} />

      {/* Ticker label — centered above head */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: RING_OUTER + 4,
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: theme.textBright,
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            fontWeight: 'bold',
            fontSize: 10,
            letterSpacing: '0.05em',
          }}
        >
          {ticker.id}
        </div>
        <div
          style={{
            height: 2,
            background: classColor,
            borderRadius: 1,
            marginTop: 2,
            opacity: 0.6,
          }}
        />
      </div>

      {/* Deviation % at 330° — left-aligned */}
      <div
        style={{
          position: 'absolute',
          left: devPos.x,
          top: devPos.y,
          transform: 'translate(0%, -50%)',
          color: devColor,
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          fontSize: 9,
        }}
      >
        {devSign}{devPercent}%
      </div>
    </div>
  );
}
