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

// Face head is ~120px tall at default zoom. Center = nose.
// Top of head ~60px above center, chin ~50px below.
// Add clearance so HUD floats outside face geometry.
const TOP_OFFSET = 68;     // above center — clears top of head
const BOTTOM_OFFSET = 62;  // below center — clears chin
const SIDE_OFFSET = 48;    // clears cheekbones

/**
 * HUD ring rendered around each face.
 * Positioned from center of face (0,0 in local coords).
 *
 * Layout:
 *   - Top: ticker symbol with class-colored underline
 *   - Left: asset class dot
 *   - Right: deviation %
 *   - Bottom: mini SVG sparkline with zero-line
 *
 * Designed to be recessive — low opacity, text-shadow for contrast,
 * legible when you look but not competing with the face geometry.
 */
export function FaceHud({ instance }: { instance: FaceInstance }) {
  const dataset = useStore((s) => s.dataset);
  // Select coarsened index directly so component only re-renders every SPARKLINE_STRIDE frames
  const coarseIndex = useStore((s) =>
    Math.floor(s.playback.current_index / SPARKLINE_STRIDE) * SPARKLINE_STRIDE,
  );

  const { ticker, frame } = instance;
  const devPercent = (frame.deviation * 100).toFixed(1);
  const devSign = frame.deviation >= 0 ? '+' : '';
  const devColor = frame.deviation >= 0 ? sol.green : sol.red;
  const classColor = CLASS_COLORS[ticker.class] || sol.base0;

  // Build sparkline path from deviation history
  const sparklineData = useMemo(() => {
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
    const w = 40;
    const h = 14;

    const path = devs
      .map((d, i) => {
        const x = (i / (devs.length - 1)) * w;
        const y = h - ((d - min) / range) * h;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    // Zero-line Y position (deviation = 0)
    const zeroY = h - ((0 - min) / range) * h;

    return { path, zeroY, w, h };
  }, [dataset, ticker.id, coarseIndex]);

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
      {/* Top: Ticker symbol with class-colored underline */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translate(-50%, 0)',
          bottom: TOP_OFFSET,
          textAlign: 'center',
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

      {/* Left: Asset class dot */}
      <div
        style={{
          position: 'absolute',
          right: SIDE_OFFSET,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <svg width={8} height={8}>
          <circle cx={4} cy={4} r={3.5} fill={classColor} opacity={0.7} />
        </svg>
      </div>

      {/* Right: Deviation % */}
      <div
        style={{
          position: 'absolute',
          left: SIDE_OFFSET,
          top: '50%',
          transform: 'translateY(-50%)',
          color: devColor,
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          fontSize: 9,
        }}
      >
        {devSign}{devPercent}%
      </div>

      {/* Bottom: Mini sparkline with zero reference */}
      {sparklineData && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: BOTTOM_OFFSET,
          }}
        >
          <svg width={sparklineData.w} height={sparklineData.h} style={{ overflow: 'visible' }}>
            {/* Zero-line (baseline reference) */}
            <line
              x1={0}
              y1={sparklineData.zeroY}
              x2={sparklineData.w}
              y2={sparklineData.zeroY}
              stroke={theme.textMuted}
              strokeWidth={0.5}
              opacity={0.3}
            />
            {/* Deviation trace */}
            <path
              d={sparklineData.path}
              fill="none"
              stroke={devColor}
              strokeWidth={1.2}
              opacity={0.6}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
