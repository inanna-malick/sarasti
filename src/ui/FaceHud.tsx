import React, { useMemo } from 'react';
import { arc as d3arc } from 'd3-shape';
import { interpolateHcl } from 'd3-interpolate';
import type { RingSignal, HudLabel, HudAnnotation, HudTheme, HudSizing } from './types';

const DEFAULT_OUTER_RADIUS = 56;
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_RING_GAP = 6;
const DEFAULT_MIN_OPACITY = 0.25;
const DEFAULT_MAX_OPACITY = 0.70;
const DEFAULT_TRACK_OPACITY = 0.18;

const TAU = 2 * Math.PI;
const MIN_ARC_ANGLE = 0.15;

// Threshold below which we skip expensive SVG filters
const FILTER_MIN_RADIUS = 80;

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

/** Convert d3.arc angle (0 = 12 o'clock, clockwise) to cartesian for positioning */
function arcAngleToXY(angle: number, radius: number): { x: number; y: number } {
  return { x: radius * Math.sin(angle), y: -radius * Math.cos(angle) };
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

  // Skip expensive filters at small sizes (Hormuz field perf)
  const useFilters = outerRadius >= FILTER_MIN_RADIUS;

  // Font sizing: scale relative to outerRadius
  const fontScale = outerRadius / DEFAULT_OUTER_RADIUS;
  const labelFontSize = Math.round(10 * fontScale);

  // Stable IDs for SVG defs (per-instance, stable across re-renders)
  const instanceId = useMemo(() => Math.random().toString(36).slice(2, 8), []);

  // Build ring arcs — directional fill: positive clockwise, negative counterclockwise
  const rings = useMemo(() => {
    const arcGen = d3arc<unknown>().cornerRadius(Math.max(1, strokeWidth * 0.6));
    const trackArcGen = d3arc<unknown>();

    return signals.map((sig, i) => {
      const r = outerRadius - i * ringGap;
      const midR = r - strokeWidth / 2;
      const mag = Math.abs(sig.value);

      // Directional arc: positive sweeps clockwise from 12, negative counterclockwise
      const arcAngle = MIN_ARC_ANGLE + mag * (TAU - MIN_ARC_ANGLE);
      const startAngle = sig.value >= 0 ? 0 : -arcAngle;
      const endAngle = sig.value >= 0 ? arcAngle : 0;

      const signalPath = arcGen({
        innerRadius: r - strokeWidth,
        outerRadius: r,
        startAngle,
        endAngle,
      })!;

      const trackPath = trackArcGen({
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
        // HCL interpolation avoids muddy gray midpoints
        color = interpolateHcl(sig.negativeColor, sig.positiveColor)(t);
        finalOpacity = opacity;
      }

      // Leading edge position (bright dot at arc tip)
      const leadAngle = sig.value >= 0 ? endAngle : startAngle;
      const leadPos = arcAngleToXY(leadAngle, midR);

      return {
        signalPath, trackPath, color, opacity: finalOpacity,
        name: sig.name, radius: r, midR, strokeWidth, mag,
        leadPos, index: i,
      };
    });
  }, [signals, outerRadius, strokeWidth, ringGap, selected, selectedColor]);

  // viewBox centered at origin
  const margin = Math.round(Math.max(20 * fontScale, 40));
  const svgExtent = outerRadius + margin;

  // Cardinal tick mark
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
        {useFilters && (
          <>
            {/* Stacked bloom glow — multiple blur passes at different radii */}
            <filter id={`glow-${instanceId}`} x="-50%" y="-50%" width="200%" height="200%">
              {/* Wide soft outer glow */}
              <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(3, strokeWidth * 1.2)} result="blur1" />
              {/* Tight bright inner glow */}
              <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(1, strokeWidth * 0.3)} result="blur2" />
              {/* Merge: outer glow (dim) + inner glow (bright) + original on top */}
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Leading edge bloom — extra bright point glow */}
            <filter id={`dot-glow-${instanceId}`} x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(2, strokeWidth * 0.5)} result="dotblur" />
              <feMerge>
                <feMergeNode in="dotblur" />
                <feMergeNode in="dotblur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle organic texture for track rings */}
            <filter id={`track-tex-${instanceId}`} x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise" />
              <feComposite in="SourceGraphic" in2="grayNoise" operator="in" />
            </filter>
          </>
        )}

        {/* Per-ring comet tail gradients — fade from bright at leading edge to transparent */}
        {rings.map((ring) => (
          <radialGradient
            key={`grad-${ring.name}`}
            id={`grad-${ring.name}-${instanceId}`}
            cx="50%" cy="50%" r="50%"
          >
            <stop offset="0%" stopColor={ring.color} stopOpacity={ring.opacity * 0.3} />
            <stop offset="70%" stopColor={ring.color} stopOpacity={ring.opacity} />
            <stop offset="100%" stopColor={ring.color} stopOpacity={ring.opacity} />
          </radialGradient>
        ))}
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

      {/* Ring tracks + signal arcs + leading edge dots */}
      {rings.map((ring) => (
        <g key={ring.name}>
          {/* Track — full circle, textured at large scale */}
          <path
            d={ring.trackPath}
            fill={ring.color}
            opacity={DEFAULT_TRACK_OPACITY}
            filter={useFilters ? `url(#track-tex-${instanceId})` : undefined}
          />

          {/* Signal arc — partial fill with stacked bloom */}
          <path
            d={ring.signalPath}
            fill={ring.color}
            opacity={ring.opacity}
            filter={useFilters ? `url(#glow-${instanceId})` : undefined}
          />

          {/* Leading edge dot — bright marker at arc tip */}
          {ring.mag > 0.05 && (
            <circle
              cx={ring.leadPos.x}
              cy={ring.leadPos.y}
              r={Math.max(1.5, ring.strokeWidth * 0.5)}
              fill="white"
              opacity={0.4 + ring.mag * 0.5}
              filter={useFilters ? `url(#dot-glow-${instanceId})` : undefined}
            />
          )}
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
