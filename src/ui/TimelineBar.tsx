import React, { useCallback } from 'react';
import { useStore } from '../store';

/**
 * Bottom-of-viewport timeline bar.
 *
 * Full width, fixed to bottom.
 * Contains:
 * - Play/pause button
 * - Speed selector (0.25x, 0.5x, 1x, 2x, 4x)
 * - Scrubber: drag to seek, click to jump
 * - Current timestamp display (human readable + "Day N of conflict")
 * - Tick marks at key events (Feb 28 strikes begin, etc.)
 * - Mini aggregate indicator: average expression intensity across all faces
 *   shown as a thin color bar (calm=cool, crisis=warm) along the scrubber track
 *
 * Props:
 * - onPlay/onPause/onSeek/onSpeedChange: callbacks to FrameDriver
 *
 * Reads from store: playback state, currentTimestamp, frameCount, instances
 */
interface TimelineBarProps {
  onTogglePlay: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.25, 0.5, 1, 2, 4, 8];

// Key events for tick marks
export const KEY_EVENTS = [
  { label: 'Strikes begin', date: '2026-02-28' },
  { label: 'Khamenei killed', date: '2026-03-01' },
  { label: 'New leader', date: '2026-03-08' },
];

export function calculateSeekIndex(clientX: number, rectLeft: number, rectWidth: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  const frac = Math.max(0, Math.min(1, (clientX - rectLeft) / rectWidth));
  return Math.round(frac * (frameCount - 1));
}

export function TimelineBar({ onTogglePlay, onSeek, onSpeedChange }: TimelineBarProps) {
  const playing = useStore((s) => s.playback.playing);
  const speed = useStore((s) => s.playback.speed);
  const currentIndex = useStore((s) => s.playback.current_index);
  const frameCount = useStore((s) => s.frameCount);
  const timestamp = useStore((s) => s.currentTimestamp);
  const dataset = useStore((s) => s.dataset);

  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onSeek(calculateSeekIndex(e.clientX, rect.left, rect.width, frameCount));
    },
    [frameCount, onSeek],
  );

  const progress = frameCount > 1 ? currentIndex / (frameCount - 1) : 0;

  // Compute day of conflict
  const dayLabel = timestamp ? formatDayLabel(timestamp) : '';

  // Compute aggregate intensity gradient
  const intensityGradient = React.useMemo(() => {
    if (!dataset || dataset.frames.length < 2) return 'rgba(255,255,255,0.06)';
    const n = dataset.frames.length;
    // Downsample if too many frames for a gradient
    const step = Math.max(1, Math.floor(n / 100));
    const stops: string[] = [];
    for (let i = 0; i < n; i += step) {
      const frame = dataset.frames[i];
      let sum = 0;
      let count = 0;
      for (const id in frame.values) {
        sum += Math.abs(frame.values[id].deviation);
        count++;
      }
      const avg = count > 0 ? sum / count : 0;
      // Map avg deviation (approx 0-2.0 range) to color
      const t = Math.min(1, avg / 1.5);
      // calm=cool (40,80,120), crisis=warm (200,80,40)
      const r = Math.round(40 + t * 160);
      const b = Math.round(120 - t * 80);
      const alpha = 0.15 + t * 0.25;
      stops.push(`rgba(${r}, 80, ${b}, ${alpha}) ${(i / (n - 1)) * 100}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [dataset]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        background: 'rgba(10, 10, 10, 0.92)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#ccc',
        zIndex: 50,
      }}
    >
      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        style={{
          background: 'none',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 4,
          color: '#ccc',
          cursor: 'pointer',
          padding: '4px 10px',
          fontSize: 14,
          minWidth: 36,
        }}
      >
        {playing ? '||' : '\u25B6'}
      </button>

      {/* Speed */}
      <select
        value={speed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 4,
          color: '#ccc',
          fontSize: 11,
          padding: '3px 4px',
        }}
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>

      {/* Scrubber */}
      <div
        onClick={handleScrub}
        style={{
          flex: 1,
          height: 20,
          background: intensityGradient,
          borderRadius: 3,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress * 100}%`,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 3,
            transition: 'width 0.1s linear',
          }}
        />
        {/* Playhead */}
        <div
          style={{
            position: 'absolute',
            left: `${progress * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'rgba(255,200,100,0.8)',
          }}
        />
        {/* Key event tick marks */}
        {dataset &&
          KEY_EVENTS.map((evt) => {
            const frac = getEventFraction(dataset.timestamps, evt.date);
            if (frac === null) return null;
            return (
              <div
                key={evt.date}
                title={evt.label}
                style={{
                  position: 'absolute',
                  left: `${frac * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'rgba(255,100,100,0.3)',
                }}
              />
            );
          })}
      </div>

      {/* Timestamp display */}
      <div style={{ minWidth: 180, textAlign: 'right', fontSize: 11, color: '#888' }}>
        <div>{timestamp ? formatTimestamp(timestamp) : '--'}</div>
        <div style={{ color: '#555', fontSize: 10 }}>{dayLabel}</div>
      </div>
    </div>
  );
}

export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export function formatDayLabel(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const start = new Date('2026-02-25T00:00:00Z');
    const dayNum = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    if (dayNum < 0) return '';
    return `Day ${dayNum} of conflict`;
  } catch {
    return '';
  }
}

export function getEventFraction(timestamps: string[], datePrefix: string): number | null {
  if (timestamps.length < 2) return null;
  const idx = timestamps.findIndex((t) => t.startsWith(datePrefix));
  if (idx < 0) return null;
  return idx / (timestamps.length - 1);
}
