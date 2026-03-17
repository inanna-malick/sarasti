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

const SPEEDS = [0.25, 0.5, 1, 2, 4];

// Key events for tick marks
const KEY_EVENTS = [
  { label: 'Strikes begin', date: '2026-02-28' },
  { label: 'Khamenei killed', date: '2026-03-01' },
  { label: 'New leader', date: '2026-03-08' },
];

export function TimelineBar({ onTogglePlay, onSeek, onSpeedChange }: TimelineBarProps) {
  const playing = useStore((s) => s.playback.playing);
  const speed = useStore((s) => s.playback.speed);
  const currentIndex = useStore((s) => s.playback.current_index);
  const frameCount = useStore((s) => s.frameCount);
  const timestamp = useStore((s) => s.currentTimestamp);
  const dataset = useStore((s) => s.dataset);

  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (frameCount <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(Math.round(frac * (frameCount - 1)));
    },
    [frameCount, onSeek],
  );

  const progress = frameCount > 1 ? currentIndex / (frameCount - 1) : 0;

  // Compute day of conflict
  const dayLabel = timestamp ? formatDayLabel(timestamp) : '';

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
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 3,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
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

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
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

function formatDayLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const start = new Date('2026-02-25T00:00:00Z');
    const dayNum = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    if (dayNum < 0) return '';
    return `Day ${dayNum} of conflict`;
  } catch {
    return '';
  }
}

function getEventFraction(timestamps: string[], datePrefix: string): number | null {
  if (timestamps.length < 2) return null;
  const idx = timestamps.findIndex((t) => t.startsWith(datePrefix));
  if (idx < 0) return null;
  return idx / (timestamps.length - 1);
}
