import React, { useEffect, useState } from 'react';
import { sol, theme } from '../theme';

interface Props {
  title: string;
  subtitle: string;
  progress: number; // [0, 1]
  currentTime: number; // seconds or frame index
  duration: number;
  isPlaying: boolean;
  speed: number;
  looping: boolean;
  /** Optional timestamp string to display instead of numeric time */
  timestamp?: string;
  onTogglePlay: () => void;
  onSeek: (fraction: number) => void;
  onSetSpeed: (multiplier: number) => void;
  onSetLoop: (loop: boolean) => void;
  onBack: () => void; // return to selector
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];

function formatTime(s: number): string {
  return s.toFixed(1) + 's';
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function ScenarioOverlay({
  title,
  subtitle,
  progress,
  currentTime,
  duration,
  isPlaying,
  speed,
  looping,
  timestamp,
  onTogglePlay,
  onSeek,
  onSetSpeed,
  onSetLoop,
  onBack,
}: Props) {
  const [showTitles, setShowTitles] = useState(false);

  useEffect(() => {
    // Fade in
    const inTimer = setTimeout(() => setShowTitles(true), 100);
    // Stay for 3s, then fade out
    const outTimer = setTimeout(() => setShowTitles(false), 3000);
    return () => {
      clearTimeout(inTimer);
      clearTimeout(outTimer);
    };
  }, [title]);

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(frac);
  };

  return (
    <>
      {/* Back button — top-left, self-contained */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'none',
          border: `1px solid ${theme.border}`,
          borderRadius: '4px',
          color: theme.textMuted,
          fontSize: '18px',
          padding: '8px 12px',
          cursor: 'pointer',
          zIndex: 410,
          transition: 'all 0.2s',
          fontFamily: 'monospace',
        }}
      >
        &#x2715;
      </button>

      {/* Play/pause button — top-right */}
      <button
        onClick={onTogglePlay}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'none',
          border: `1px solid ${theme.border}`,
          borderRadius: '4px',
          color: theme.textMuted,
          fontSize: '12px',
          padding: '8px 12px',
          cursor: 'pointer',
          zIndex: 410,
          transition: 'all 0.2s',
          fontFamily: 'monospace',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        {isPlaying ? 'pause' : 'play'}
      </button>

      {/* Center titles — non-interactive, fades out */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          opacity: showTitles ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
          zIndex: 400,
          fontFamily: 'monospace',
        }}
      >
        <h1
          style={{
            color: theme.textBright,
            fontSize: '32px',
            letterSpacing: '8px',
            margin: '0 0 16px 0',
            fontWeight: 400,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            color: theme.textMuted,
            fontSize: '14px',
            letterSpacing: '2px',
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Bottom controls bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 410,
          fontFamily: 'monospace',
          userSelect: 'none',
        }}
      >
        {/* Controls row: speed + time + loop */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 16px',
          }}
        >
          {/* Speed buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                style={{
                  background: speed === s ? 'rgba(181, 137, 0, 0.2)' : 'none',
                  border: speed === s ? '1px solid rgba(181, 137, 0, 0.5)' : `1px solid ${theme.borderSubtle}`,
                  borderRadius: '3px',
                  color: speed === s ? sol.yellow : theme.textMuted,
                  fontSize: '10px',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  transition: 'all 0.15s',
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Time readout */}
          <span style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', fontVariantNumeric: 'tabular-nums' }}>
            {timestamp ? formatDate(timestamp) : `${formatTime(currentTime)} / ${formatTime(duration)}`}
          </span>

          {/* Loop toggle + pause hint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isPlaying && (
              <span style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Paused
              </span>
            )}
            <button
              onClick={() => onSetLoop(!looping)}
              style={{
                background: looping ? 'rgba(181, 137, 0, 0.2)' : 'none',
                border: looping ? '1px solid rgba(181, 137, 0, 0.5)' : `1px solid ${theme.borderSubtle}`,
                borderRadius: '3px',
                color: looping ? sol.yellow : theme.textMuted,
                fontSize: '10px',
                padding: '2px 6px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                transition: 'all 0.15s',
              }}
            >
              loop
            </button>
          </div>
        </div>

        {/* Scrubber */}
        <div
          className="scenario-scrubber"
          onClick={handleScrubberClick}
          style={{
            height: '4px',
            background: theme.bgPanel,
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: theme.textBright,
              transition: isPlaying ? 'none' : 'width 0.1s ease-out',
            }}
          />
          {/* Playhead dot */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${progress * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: sol.yellow,
              opacity: 0.8,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      <style>{`
        button:hover {
          color: ${theme.textBright} !important;
          border-color: ${theme.accent} !important;
          background: ${theme.hoverBg} !important;
        }
        .scenario-scrubber:hover {
          height: 6px !important;
        }
      `}</style>
    </>
  );
}
