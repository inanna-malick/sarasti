import React from 'react';
import { useStore } from '../store';
import type { LayoutStrategy } from '../types';

/**
 * Small floating control panel, top-right corner.
 *
 * Contains:
 * - Layout selector: family-rows / class-clusters / reactivity-sweep
 * - Loop toggle
 * - "About this piece" info button
 *
 * Props:
 * - onLayoutChange: callback to FrameDriver.setLayout()
 */
interface ControlsProps {
  onLayoutChange: (strategy: LayoutStrategy) => void;
  onLoopChange: (loop: boolean) => void;
}

const LAYOUTS: { label: string; strategy: LayoutStrategy }[] = [
  { label: 'Families', strategy: { kind: 'family-rows' } },
  { label: 'Classes', strategy: { kind: 'class-clusters' } },
  { label: 'Reactivity', strategy: { kind: 'reactivity-sweep' } },
];

export function Controls({ onLayoutChange, onLoopChange }: ControlsProps) {
  const currentLayout = useStore((s) => s.layout);
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
      {/* Layout selector */}
      <div style={{ display: 'flex', gap: 4 }}>
        {LAYOUTS.map(({ label, strategy }) => (
          <button
            key={strategy.kind}
            onClick={() => onLayoutChange(strategy)}
            style={{
              background:
                currentLayout.kind === strategy.kind
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 3,
              color: currentLayout.kind === strategy.kind ? '#ddd' : '#666',
              cursor: 'pointer',
              padding: '3px 8px',
              fontSize: 10,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loop toggle */}
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
          style={{ accentColor: '#888' }}
        />
        loop
      </label>
    </div>
  );
}
