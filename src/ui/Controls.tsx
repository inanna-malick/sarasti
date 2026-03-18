import React from 'react';
import { useStore } from '../store';

/**
 * Small floating control panel, top-right corner.
 *
 * Contains:
 * - Loop toggle
 * - "Technical summary" info button
 */
interface ControlsProps {
  onLoopChange: (loop: boolean) => void;
}

export function Controls({ onLoopChange }: ControlsProps) {
  const loop = useStore((s) => s.playback.loop);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        background: 'rgba(10, 10, 10, 0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        padding: '8px 10px',
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#999',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 50,
      }}
    >
      {/* Loop toggle & About */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            color: '#777',
            fontSize: 10,
          }}
        >
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => onLoopChange(e.target.checked)}
            style={{ accentColor: '#888', margin: 0 }}
          />
          loop
        </label>

        <button
          onClick={() => useStore.getState().setShowLanding(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#555',
            cursor: 'pointer',
            fontSize: 10,
            padding: '2px 4px',
            textDecoration: 'underline',
          }}
        >
          Technical summary
        </button>
      </div>

      <a
        href="?explorer=true"
        style={{
          color: '#6cf',
          fontSize: 10,
          textDecoration: 'none',
          opacity: 0.7,
          textAlign: 'right',
        }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7'; }}
      >
        Explorer
      </a>
    </div>
  );
}
