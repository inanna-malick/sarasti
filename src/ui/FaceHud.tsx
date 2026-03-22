import React, { useMemo } from 'react';
import { arc as d3arc } from 'd3-shape';
import { interpolateRgb } from 'd3-interpolate';
import type { RingSignal, HudLabel, HudAnnotation, HudTheme, HudSizing } from './types';

const DEFAULT_OUTER_RADIUS = 56;
const DEFAULT_STROKE_WIDTH = 1;
const DEFAULT_RING_GAP = 6;
const DEFAULT_MIN_OPACITY = 0.12;
const DEFAULT_MAX_OPACITY = 0.45;

const TAU = 2 * Math.PI;

interface FaceHudProps {
  signals: RingSignal[];
  label?: HudLabel;
  annotations?: HudAnnotation[];
  selected?: boolean;
  selectedColor?: string;
  theme?: HudTheme;
  sizing?: HudSizing;
}

function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: radius * Math.cos(rad), y: -radius * Math.sin(rad) };
}

export function FaceHud({
  signals,
  label,
  annotations,
  selected,
  selectedColor,
  theme,
  sizing,
}: FaceHudProps) {
  const outerRadius = sizing?.outerRadius ?? DEFAULT_OUTER_RADIUS;
  const strokeWidth = sizing?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const ringGap = sizing?.ringGap ?? DEFAULT_RING_GAP;
  const fontFamily = theme?.fontFamily ?? 'monospace';
  const labelColor = theme?.labelColor ?? '#93a1a1';
  const labelShadow = theme?.labelShadow ?? '0 1px 4px rgba(0,0,0,0.9)';

  // Build ring paths — innermost signal first, outermost last
  const rings = useMemo(() => {
    const arcGen = d3arc<unknown>();
    return signals.map((sig, i) => {
      const r = outerRadius - i * ringGap;
      const path = arcGen({
        innerRadius: r - strokeWidth,
        outerRadius: r,
        startAngle: 0,
        endAngle: TAU,
      })!;

      const minOp = sig.minOpacity ?? DEFAULT_MIN_OPACITY;
      const maxOp = sig.maxOpacity ?? DEFAULT_MAX_OPACITY;
      const mag = Math.abs(sig.value);
      const opacity = minOp + mag * (maxOp - minOp);

      // Outermost ring (i=0) gets selection override
      const isOutermost = i === 0;
      let color: string;
      let finalOpacity: number;

      if (selected && isOutermost && selectedColor) {
        color = selectedColor;
        finalOpacity = 0.55;
      } else {
        const t = (sig.value + 1) / 2; // map [-1,1] to [0,1]
        color = interpolateRgb(sig.negativeColor, sig.positiveColor)(t);
        finalOpacity = opacity;
      }

      return { path, color, opacity: finalOpacity, name: sig.name, radius: r, strokeWidth };
    });
  }, [signals, outerRadius, strokeWidth, ringGap, selected, selectedColor]);

  return (
    <svg
      width={0}
      height={0}
      style={{ overflow: 'visible', opacity: 0.75 }}
      aria-label="Face HUD"
    >
      {/* Signal rings */}
      {rings.map((ring) => (
        <path
          key={ring.name}
          d={ring.path}
          fill={ring.color}
          opacity={ring.opacity}
        />
      ))}

      {/* Label above rings */}
      {label && (
        <g>
          <text
            x={0}
            y={-(outerRadius + 4)}
            textAnchor="middle"
            dominantBaseline="auto"
            fill={labelColor}
            fontFamily={fontFamily}
            fontSize={10}
            fontWeight="bold"
            letterSpacing="0.05em"
            style={{ filter: `drop-shadow(${labelShadow})` }}
          >
            {label.text}
          </text>
          {label.accentColor && (
            <rect
              x={-12}
              y={-(outerRadius + 1)}
              width={24}
              height={2}
              rx={1}
              fill={label.accentColor}
              opacity={0.6}
            />
          )}
        </g>
      )}

      {/* Annotations at polar positions */}
      {annotations?.map((ann, i) => {
        const ringIdx = ann.ringIndex ?? 0;
        const r = rings[ringIdx]?.radius ?? outerRadius;
        const pos = polarToXY(ann.angleDeg, r);
        const fontSize = ann.fontSize ?? 9;
        const anchor = ann.align === 'right' ? 'end' : 'start';

        return (
          <text
            key={i}
            x={pos.x}
            y={pos.y}
            textAnchor={anchor}
            dominantBaseline="central"
            fill={ann.color}
            fontFamily={fontFamily}
            fontSize={fontSize}
            fontVariant="tabular-nums"
            style={{ filter: `drop-shadow(${labelShadow})` }}
          >
            {ann.text}
          </text>
        );
      })}
    </svg>
  );
}
