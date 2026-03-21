import React from 'react';
import { useStore } from '../../../src/store';
import { sol, theme } from '../theme';

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
        background: theme.bgPanelAlpha,
        border: `1px solid ${theme.borderSubtle}`,
        borderRadius: 6,
        padding: '8px 10px',
        fontFamily: 'monospace',
        fontSize: 11,
        color: theme.text,
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
            color: theme.textMuted,
            fontSize: 10,
          }}
        >
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => onLoopChange(e.target.checked)}
            style={{ accentColor: sol.cyan, margin: 0 }}
          />
          loop
        </label>

        <button
          onClick={() => useStore.getState().setShowLanding(true)}
          style={{
            background: 'none',
            border: 'none',
            color: theme.textMuted,
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
          color: sol.cyan,
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
