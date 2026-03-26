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

export function ZScoreRow({
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

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'monospace',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '11px',
    height: '18px',
    color: textColor,
  };

  const labelStyle: React.CSSProperties = {
    width: '36px',
    color: labelColor,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '10px',
  };

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={{ width: '72px', textAlign: 'right' }}>{formatRaw(raw)}</span>
      <span style={{ width: '12px', textAlign: 'center', color: labelColor }}>z</span>
      <span style={{ width: '48px', textAlign: 'right', color: zColor }}>{formatZ(z)}</span>
    </div>
  );
}
