import React from 'react';
import { arc as d3arc } from 'd3-shape';
import { interpolateRgb } from 'd3-interpolate';
import type { RingSignal, HudLabel, HudAnnotation, HudTheme, HudSizing } from './types';

interface FaceHudProps {
  signals: RingSignal[];
  label?: HudLabel;
  annotations?: HudAnnotation[];
  selected?: boolean;
  selectedColor?: string;
  theme?: HudTheme;
  sizing?: HudSizing;
}

const DEFAULTS = {
  outerRadius: 56,
  strokeWidth: 1,
  ringGap: 6,
  minOpacity: 0.12,
  maxOpacity: 0.45,
  fontFamily: 'monospace',
  labelColor: '#93a1a1',
  labelShadow: '0 1px 4px rgba(0,0,0,0.9)',
};

function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: radius * Math.cos(rad), y: -radius * Math.sin(rad) };
}

const fullCircleArc = d3arc<{ inner: number; outer: number }>()
  .innerRadius((d) => d.inner)
  .outerRadius((d) => d.outer)
  .startAngle(0)
  .endAngle(2 * Math.PI);

export function FaceHud({ signals, label, annotations, selected, selectedColor, theme, sizing }: FaceHudProps) {
  const outerR = sizing?.outerRadius ?? DEFAULTS.outerRadius;
  const sw = sizing?.strokeWidth ?? DEFAULTS.strokeWidth;
  const gap = sizing?.ringGap ?? DEFAULTS.ringGap;
  const fontFamily = theme?.fontFamily ?? DEFAULTS.fontFamily;
  const labelColor = theme?.labelColor ?? DEFAULTS.labelColor;
  const labelShadow = theme?.labelShadow ?? DEFAULTS.labelShadow;

  // Margin for label text above + annotation text to side
  const margin = 24;
  const totalSize = outerR + margin;

  return (
    <svg
      width={0}
      height={0}
      viewBox={`${-totalSize} ${-totalSize} ${totalSize * 2} ${totalSize * 2}`}
      style={{ overflow: 'visible', opacity: 0.75 }}
    >
      {signals.map((signal, i) => {
        const radius = outerR - i * gap;
        if (radius <= 0) return null;

        const minOp = signal.minOpacity ?? DEFAULTS.minOpacity;
        const maxOp = signal.maxOpacity ?? DEFAULTS.maxOpacity;
        const mag = Math.abs(signal.value);
        const opacity = minOp + mag * (maxOp - minOp);

        const isOutermostSelected = selected && i === 0 && selectedColor;
        const color = isOutermostSelected
          ? selectedColor!
          : interpolateRgb(signal.negativeColor, signal.positiveColor)((signal.value + 1) / 2);
        const ringOpacity = isOutermostSelected ? 0.55 : opacity;

        const pathData = fullCircleArc({ inner: radius - sw / 2, outer: radius + sw / 2 });

        return (
          <path
            key={signal.name}
            d={pathData!}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            opacity={ringOpacity}
          />
        );
      })}

      {/* Label centered above rings */}
      {label && (
        <g>
          <text
            x={0}
            y={-(outerR + 4)}
            textAnchor="middle"
            dominantBaseline="auto"
            fill={label.color}
            fontFamily={fontFamily}
            fontWeight="bold"
            fontSize={10}
            letterSpacing="0.05em"
            style={{ filter: labelShadow ? `drop-shadow(${labelShadow})` : undefined }}
          >
            {label.text}
          </text>
          {label.accentColor && (
            <rect
              x={-12}
              y={-(outerR + 1)}
              width={24}
              height={2}
              rx={1}
              fill={label.accentColor}
              opacity={0.6}
            />
          )}
        </g>
      )}

      {/* Annotations at polar coordinates */}
      {annotations?.map((ann, i) => {
        const ringIdx = ann.ringIndex ?? 0;
        const radius = outerR - ringIdx * gap;
        const pos = polarToXY(ann.angleDeg, radius);
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
            style={{ filter: labelShadow ? `drop-shadow(${labelShadow})` : undefined }}
          >
            {ann.text}
          </text>
        );
      })}
    </svg>
  );
}
