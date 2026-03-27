import React from 'react';

interface ZScoreRowProps {
  label: string;
  raw: number;
  z: number;
  zPositiveColor?: string;
  zNegativeColor?: string;
  zMutedColor?: string;
  textColor?: string;
  labelColor?: string;
}

const BASE_CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'monospace',
  fontVariantNumeric: 'tabular-nums',
  fontSize: '11px',
  height: '18px',
};

const BASE_LABEL_STYLE: React.CSSProperties = {
  width: '36px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontSize: '10px',
};

export const ZScoreRow = React.memo(function ZScoreRow({
  label,
  raw,
  z,
  zPositiveColor = '#2aa198',
  zNegativeColor = '#dc322f',
  zMutedColor = '#586e75',
  textColor = '#839496',
  labelColor = '#586e75',
}: ZScoreRowProps) {
  let zColor = zMutedColor;
  if (Math.abs(z) >= 0.3) {
    zColor = z >= 0 ? zPositiveColor : zNegativeColor;
  }

  const formatRaw = (v: number) => v.toFixed(4);
  const formatZ = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2);

  return (
    <div style={{ ...BASE_CONTAINER_STYLE, color: textColor }}>
      <span style={{ ...BASE_LABEL_STYLE, color: labelColor }}>{label}</span>
      <span style={{ width: '72px', textAlign: 'right' }}>{formatRaw(raw)}</span>
      <span style={{ width: '12px', textAlign: 'center', color: labelColor }}>z</span>
      <span style={{ width: '48px', textAlign: 'right', color: zColor }}>{formatZ(z)}</span>
    </div>
  );
});
