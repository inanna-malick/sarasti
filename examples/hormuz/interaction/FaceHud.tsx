import React, { useMemo } from 'react';
import type { FaceInstance, AssetClass } from '../../../src/types';
import { getTickerTimeseries } from '../../../src/data/loader';
import { useStore } from '../../../src/store';
import { sol, theme } from '../theme';

const CLASS_COLORS: Record<AssetClass, string> = {
  energy: sol.orange,
  equity: sol.blue,
  fear: sol.red,
  currency: sol.violet,
  commodity: sol.green,
  media: sol.magenta,
};

// Coarsen frame index to reduce sparkline recomputation (every 4 frames)
const SPARKLINE_STRIDE = 4;

// Arc sparkline geometry (math coords: 0° = right, CCW positive)
const ARC_RADIUS = 65;
const ARC_START_DEG = 210; // left side, below horizontal
const ARC_END_DEG = 330;   // right side, below horizontal
const LABEL_ANGLE_DEG = 160;  // ticker label position
const DEV_ANGLE_DEG = 330;    // deviation % position
const RADIAL_WOBBLE = 12;     // max px deviation from arc

function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: radius * Math.cos(rad), y: -radius * Math.sin(rad) };
}

/**
 * HUD ring rendered around each face.
 * Deviation sparkline traces a circular arc over the top of the face (210°→330° CCW).
 * Ticker label at 160°, deviation % at 330°.
 */
export function FaceHud({ instance }: { instance: FaceInstance }) {
  const dataset = useStore((s) => s.dataset);
  const coarseIndex = useStore((s) =>
    Math.floor(s.playback.current_index / SPARKLINE_STRIDE) * SPARKLINE_STRIDE,
  );

  const { ticker, frame } = instance;
  const devPercent = (frame.deviation * 100).toFixed(1);
  const devSign = frame.deviation >= 0 ? '+' : '';
  const devColor = frame.deviation >= 0 ? sol.green : sol.red;
  const classColor = CLASS_COLORS[ticker.class] || sol.base0;

  // Build arc sparkline from deviation history
  const arcData = useMemo(() => {
    if (!dataset) return null;
    const series = getTickerTimeseries(dataset, ticker.id);
    const end = Math.min(coarseIndex + SPARKLINE_STRIDE, series.length);
    const start = Math.max(0, end - 40);
    const slice = series.slice(start, end);
    if (slice.length < 2) return null;

    const devs = slice.map((f) => f?.deviation ?? 0);
    const min = Math.min(...devs);
    const max = Math.max(...devs);
    const range = max - min || 0.001;

    const arcSpan = ARC_END_DEG - ARC_START_DEG; // 120°

    const points = devs.map((d, i) => {
      const t = i / (devs.length - 1);
      const angleDeg = ARC_START_DEG + t * arcSpan;
      const normalized = (d - min) / range; // 0..1
      const wobble = (normalized - 0.5) * 2 * RADIAL_WOBBLE; // -WOBBLE..+WOBBLE
      const r = ARC_RADIUS + wobble;
      const { x, y } = polarToXY(angleDeg, r);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });

    // Reference arc (perfect circle at ARC_RADIUS)
    const refPoints = Array.from({ length: 61 }, (_, i) => {
      const t = i / 60;
      const angleDeg = ARC_START_DEG + t * arcSpan;
      const { x, y } = polarToXY(angleDeg, ARC_RADIUS);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return { path: points.join(' '), refPath: refPoints.join(' ') };
  }, [dataset, ticker.id, coarseIndex]);

  // Label positions
  const labelPos = polarToXY(LABEL_ANGLE_DEG, ARC_RADIUS);
  const devPos = polarToXY(DEV_ANGLE_DEG, ARC_RADIUS);

  return (
    <div
      style={{
        position: 'relative',
        width: 0,
        height: 0,
        fontFamily: 'monospace',
        fontSize: 9,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        opacity: 0.75,
      }}
    >
      <svg
        width={200}
        height={200}
        viewBox="-100 -100 200 200"
        style={{
          position: 'absolute',
          left: -100,
          top: -100,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        {/* Reference arc */}
        {arcData && (
          <path
            d={arcData.refPath}
            fill="none"
            stroke={theme.textMuted}
            strokeWidth={0.8}
            opacity={0.15}
          />
        )}
        {/* Deviation trace arc */}
        {arcData && (
          <path
            d={arcData.path}
            fill="none"
            stroke={devColor}
            strokeWidth={1.2}
            opacity={0.6}
          />
        )}
      </svg>

      {/* Ticker label at 160° — right-aligned */}
      <div
        style={{
          position: 'absolute',
          left: labelPos.x,
          top: labelPos.y,
          transform: 'translate(-100%, -50%)',
          textAlign: 'right',
        }}
      >
        <div
          style={{
            color: theme.textBright,
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            fontWeight: 'bold',
            fontSize: 10,
            letterSpacing: '0.05em',
          }}
        >
          {ticker.id}
        </div>
        <div
          style={{
            height: 2,
            background: classColor,
            borderRadius: 1,
            marginTop: 2,
            opacity: 0.6,
          }}
        />
      </div>

      {/* Deviation % at 330° — left-aligned */}
      <div
        style={{
          position: 'absolute',
          left: devPos.x,
          top: devPos.y,
          transform: 'translate(0%, -50%)',
          color: devColor,
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          fontSize: 9,
        }}
      >
        {devSign}{devPercent}%
      </div>
    </div>
  );
}
