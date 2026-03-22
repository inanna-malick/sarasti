import React, { useMemo } from 'react';
import { arc as d3arc } from 'd3-shape';
import { interpolateRgb } from 'd3-interpolate';
import type { RingSignal, HudLabel, HudAnnotation, HudTheme, HudSizing } from './types';

const DEFAULT_OUTER_RADIUS = 56;
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_RING_GAP = 6;
const DEFAULT_MIN_OPACITY = 0.25;
const DEFAULT_MAX_OPACITY = 0.70;
const DEFAULT_TRACK_OPACITY = 0.18;

const TAU = 2 * Math.PI;
const MIN_ARC_ANGLE = 0.15;

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

  // Font sizing: scale relative to outerRadius
  const fontScale = outerRadius / DEFAULT_OUTER_RADIUS;
  const labelFontSize = Math.round(10 * fontScale);

  // Build ring arcs — partial fill based on |value|
  const rings = useMemo(() => {
    const arcGen = d3arc<unknown>();
    return signals.map((sig, i) => {
      const r = outerRadius - i * ringGap;
      const mag = Math.abs(sig.value);

      const arcAngle = MIN_ARC_ANGLE + mag * (TAU - MIN_ARC_ANGLE);

      const signalPath = arcGen({
        innerRadius: r - strokeWidth,
        outerRadius: r,
        startAngle: -arcAngle / 2,
        endAngle: arcAngle / 2,
      })!;

      const trackPath = arcGen({
        innerRadius: r - strokeWidth,
        outerRadius: r,
        startAngle: 0,
        endAngle: TAU,
      })!;

      const minOp = sig.minOpacity ?? DEFAULT_MIN_OPACITY;
      const maxOp = sig.maxOpacity ?? DEFAULT_MAX_OPACITY;
      const opacity = minOp + mag * (maxOp - minOp);

      const isOutermost = i === 0;
      let color: string;
      let finalOpacity: number;

      if (selected && isOutermost && selectedColor) {
        color = selectedColor;
        finalOpacity = 0.55;
      } else {
        const t = (sig.value + 1) / 2;
        color = interpolateRgb(sig.negativeColor, sig.positiveColor)(t);
        finalOpacity = opacity;
      }

      return { signalPath, trackPath, color, opacity: finalOpacity, name: sig.name, radius: r, strokeWidth };
    });
  }, [signals, outerRadius, strokeWidth, ringGap, selected, selectedColor]);

  // viewBox centered at origin — generous margin for labels + annotations
  const margin = Math.round(Math.max(20 * fontScale, 40));
  const svgExtent = outerRadius + margin;

  // Glow filter ID unique per instance (safe for multiple HUDs on page)
  const filterId = useMemo(() => `hud-glow-${Math.random().toString(36).slice(2, 8)}`, []);

  // Cardinal tick mark length (proportional to stroke width)
  const tickLength = Math.max(4, strokeWidth * 2);
  const outerRingRadius = rings[0]?.radius ?? outerRadius;

  return (
    <svg
      width={svgExtent * 2}
      height={svgExtent * 2}
      viewBox={`${-svgExtent} ${-svgExtent} ${svgExtent * 2} ${svgExtent * 2}`}
      style={{ overflow: 'visible', margin: -svgExtent }}
      aria-label="Face HUD"
    >
      <defs>
        {/* Glow filter for signal arcs */}
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(2, strokeWidth * 0.8)} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Cardinal tick marks on outer ring — N/E/S/W */}
      {[90, 0, 270, 180].map((angleDeg) => {
        const inner = outerRingRadius - tickLength;
        const outer = outerRingRadius + tickLength;
        const posInner = polarToXY(angleDeg, inner);
        const posOuter = polarToXY(angleDeg, outer);
        return (
          <line
            key={`tick-${angleDeg}`}
            x1={posInner.x}
            y1={posInner.y}
            x2={posOuter.x}
            y2={posOuter.y}
            stroke={labelColor}
            strokeWidth={1}
            opacity={0.2}
          />
        );
      })}

      {/* Ring tracks (dim reference circles) + glowing signal arcs */}
      {rings.map((ring) => (
        <g key={ring.name}>
          {/* Track — full circle, visible reference gauge */}
          <path
            d={ring.trackPath}
            fill={ring.color}
            opacity={DEFAULT_TRACK_OPACITY}
          />
          {/* Signal arc — partial fill with glow */}
          <path
            d={ring.signalPath}
            fill={ring.color}
            opacity={ring.opacity}
            filter={`url(#${filterId})`}
          />
        </g>
      ))}

      {/* Label above rings */}
      {label && (
        <g>
          <text
            x={0}
            y={-(outerRadius + 4 * fontScale)}
            textAnchor="middle"
            dominantBaseline="auto"
            fill={labelColor}
            fontFamily={fontFamily}
            fontSize={labelFontSize}
            fontWeight="bold"
            letterSpacing="0.05em"
            style={{ filter: `drop-shadow(${labelShadow})` }}
          >
            {label.text}
          </text>
          {label.accentColor && (
            <rect
              x={-12 * fontScale}
              y={-(outerRadius + 1 * fontScale)}
              width={24 * fontScale}
              height={Math.max(2, 2 * fontScale)}
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
        const fontSize = Math.round((ann.fontSize ?? 9) * fontScale);
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
            fontWeight={ann.fontSize && ann.fontSize >= 11 ? 'bold' : 'normal'}
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
