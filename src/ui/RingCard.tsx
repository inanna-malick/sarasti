import React from 'react';
import { interpolateHcl } from 'd3-interpolate';
import type { RingMeta } from './ringMeta';
import { MiniArc } from './MiniArc';
import { ZScoreRow } from './ZScoreRow';

export interface RingCardTheme {
  bg: string;
  bgSubtle: string;
  border: string;
  text: string;
  textMuted: string;
}

const DEFAULT_THEME: RingCardTheme = {
  bg: '#002b36',
  bgSubtle: '#073642',
  border: 'rgba(88,110,117,0.3)',
  text: '#839496',
  textMuted: '#586e75',
};

interface RingCardProps {
  meta: RingMeta;
  value: number;
  input: number;
  zScores: Record<string, number>;
  rawValues: Record<string, number>;
  theme?: RingCardTheme;
}

const CARD_STYLE: React.CSSProperties = {
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  fontFamily: 'monospace',
};

export const RingCard = React.memo(function RingCard({ meta, value, input, zScores, rawValues, theme = DEFAULT_THEME }: RingCardProps) {
  const accent = value >= 0 ? meta.positiveColor : meta.negativeColor;
  const pole = value >= 0 ? meta.poles[1] : meta.poles[0];
  const barColor = interpolateHcl(theme.bg, accent)(Math.abs(value));

  return (
    <div style={{
      ...CARD_STYLE,
      background: theme.bg,
      border: `1px solid ${theme.border}`,
      color: theme.text,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '24px' }}>
        <MiniArc value={value} negativeColor={meta.negativeColor} positiveColor={meta.positiveColor} trackBase={theme.bg} />
        <span style={{ fontWeight: 'bold', color: accent, fontSize: '12px' }}>{meta.label}</span>
        <span style={{ textTransform: 'uppercase', color: accent, fontSize: '12px', flexGrow: 1, letterSpacing: '1px' }}>{meta.key}</span>
        <span style={{ color: accent, fontSize: '11px', width: '40px', textAlign: 'right' }}>{value.toFixed(2)}</span>
        <span style={{ fontSize: '10px', color: theme.textMuted, width: '40px', textAlign: 'right', textTransform: 'uppercase' }}>{pole}</span>
      </div>

      {/* Formula */}
      <div style={{ color: theme.textMuted, fontSize: '9px', padding: '2px 0' }}>{meta.formula}</div>

      {/* Metric rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {meta.zScoreKeys.map(zKey => {
          const rawKey = zKey.replace('_z', '');
          return (
            <ZScoreRow
              key={zKey}
              label={rawKey.toUpperCase()}
              raw={rawValues[rawKey] ?? 0}
              z={zScores[zKey] ?? 0}
              textColor={theme.text}
              labelColor={theme.textMuted}
            />
          );
        })}
      </div>

      {/* Result */}
      <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px', padding: '2px 0' }}>
        → σ({input.toFixed(2)}, {meta.steepness}) = {value.toFixed(2)}
      </div>

      {/* Activation bar */}
      <div style={{ height: '3px', width: '100%', background: theme.bgSubtle, marginTop: '4px' }}>
        <div style={{ height: '100%', width: `${Math.abs(value) * 100}%`, background: barColor }} />
      </div>
    </div>
  );
});
