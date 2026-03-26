import { interpolateHcl } from 'd3-interpolate';

interface MiniArcProps {
  value: number;
  negativeColor: string;
  positiveColor: string;
  /** Background color for track darkening. Default: solarized base03 */
  trackBase?: string;
  size?: number;
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.sin(startAngle);
  const y1 = cy - r * Math.cos(startAngle);
  const x2 = cx + r * Math.sin(endAngle);
  const y2 = cy - r * Math.cos(endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  const sweep = endAngle > startAngle ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

export function MiniArc({ value, negativeColor, positiveColor, trackBase = '#002b36', size = 24 }: MiniArcProps) {
  const r_out = size / 2 - 1;
  const r_in = r_out - 3;
  const center = size / 2;

  const color = value >= 0 ? positiveColor : negativeColor;
  const trackColor = interpolateHcl(trackBase, color)(0.2);
  const signalColor = interpolateHcl(trackBase, color)(Math.min(1, Math.abs(value)));

  const absVal = Math.abs(value);
  const arcLen = (0.12 + absVal * 0.88) * 2 * Math.PI;
  const startAngle = 0;
  const endAngle = value >= 0 ? arcLen : -arcLen;

  const trackPath = `
    ${arcPath(center, center, r_out, 0, 2 * Math.PI - 0.0001)}
    L ${center + r_in * Math.sin(2 * Math.PI - 0.0001)} ${center - r_in * Math.cos(2 * Math.PI - 0.0001)}
    ${arcPath(center, center, r_in, 2 * Math.PI - 0.0001, 0)}
    Z
  `;

  const signalPath = `
    ${arcPath(center, center, r_out, startAngle, endAngle)}
    L ${center + r_in * Math.sin(endAngle)} ${center - r_in * Math.cos(endAngle)}
    ${arcPath(center, center, r_in, endAngle, startAngle)}
    Z
  `;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={trackPath} fill={trackColor} />
      <path d={signalPath} fill={signalColor} />
    </svg>
  );
}
