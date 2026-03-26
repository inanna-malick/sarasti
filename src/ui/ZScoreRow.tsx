import { sol } from '../../examples/demo/theme';

interface ZScoreRowProps {
  label: string;
  raw: number;
  z: number;
  zPositiveColor?: string;
  zNegativeColor?: string;
  zMutedColor?: string;
}

export function ZScoreRow({
  label,
  raw,
  z,
  zPositiveColor = sol.cyan,
  zNegativeColor = sol.red,
  zMutedColor = sol.base01
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
    color: sol.base0,
  };

  const labelStyle: React.CSSProperties = {
    width: '36px',
    color: sol.base01,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '10px',
  };

  const rawStyle: React.CSSProperties = {
    width: '72px',
    textAlign: 'right',
  };

  const zLabelStyle: React.CSSProperties = {
    width: '12px',
    textAlign: 'center',
    color: sol.base01,
  };

  const zScoreStyle: React.CSSProperties = {
    width: '48px',
    textAlign: 'right',
    color: zColor,
  };

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={rawStyle}>{formatRaw(raw)}</span>
      <span style={zLabelStyle}>z</span>
      <span style={zScoreStyle}>{formatZ(z)}</span>
    </div>
  );
}
