import { interpolateHcl } from 'd3-interpolate';
import { sol, theme } from '../../examples/demo/theme';
import { RingMeta } from './ringMeta';
import { MiniArc } from './MiniArc';
import { ZScoreRow } from './ZScoreRow';

interface RingCardProps {
  meta: RingMeta;
  value: number;
  input: number;
  zScores: Record<string, number>;
  rawValues: Record<string, number>;
}

export function RingCard({ meta, value, input, zScores, rawValues }: RingCardProps) {
  const accent = value >= 0 ? meta.positiveColor : meta.negativeColor;
  const pole = value >= 0 ? meta.poles[1] : meta.poles[0];
  const barColor = interpolateHcl(sol.base03, accent)(Math.abs(value));

  const cardStyle: React.CSSProperties = {
    background: sol.base03,
    border: theme.border,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontFamily: 'monospace',
    color: sol.base0,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    height: '24px',
  };

  const letterStyle: React.CSSProperties = {
    fontWeight: 'bold',
    color: accent,
    fontSize: '12px',
  };

  const nameStyle: React.CSSProperties = {
    textTransform: 'uppercase',
    color: accent,
    fontSize: '12px',
    flexGrow: 1,
    letterSpacing: '1px',
  };

  const valStyle: React.CSSProperties = {
    color: accent,
    fontSize: '11px',
    width: '40px',
    textAlign: 'right',
  };

  const poleStyle: React.CSSProperties = {
    fontSize: '10px',
    color: sol.base01,
    width: '40px',
    textAlign: 'right',
    textTransform: 'uppercase',
  };

  const formulaStyle: React.CSSProperties = {
    color: sol.base01,
    fontSize: '9px',
    padding: '2px 0',
  };

  const resultRowStyle: React.CSSProperties = {
    fontSize: '10px',
    color: sol.base01,
    marginTop: '2px',
    padding: '2px 0',
  };

  const barContainerStyle: React.CSSProperties = {
    height: '3px',
    width: '100%',
    background: sol.base02,
    marginTop: '4px',
  };

  const barFillStyle: React.CSSProperties = {
    height: '100%',
    width: `${Math.abs(value) * 100}%`,
    background: barColor,
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <MiniArc value={value} negativeColor={meta.negativeColor} positiveColor={meta.positiveColor} />
        <span style={letterStyle}>{meta.label}</span>
        <span style={nameStyle}>{meta.key}</span>
        <span style={valStyle}>{value.toFixed(2)}</span>
        <span style={poleStyle}>{pole}</span>
      </div>

      <div style={formulaStyle}>{meta.formula}</div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {meta.zScoreKeys.map(zKey => {
          const rawKey = zKey.replace('_z', '');
          const label = rawKey.toUpperCase();
          const raw = rawValues[rawKey] ?? 0;
          const z = zScores[zKey] ?? 0;
          return <ZScoreRow key={zKey} label={label} raw={raw} z={z} />;
        })}
      </div>

      <div style={resultRowStyle}>
        → σ({input.toFixed(2)}, {meta.steepness}) = {value.toFixed(2)}
      </div>

      <div style={barContainerStyle}>
        <div style={barFillStyle} />
      </div>
    </div>
  );
}
