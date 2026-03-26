import React from 'react';
import type { FaceInstance, AssetClass } from '../../../src/types';
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

/**
 * Label-only HUD overlay for episode faces.
 * Ring signals are now handled by 3D HudRings3D in the compositor.
 */
export function FaceHud({ instance }: { instance: FaceInstance }) {
  const selectedId = useStore((s) => s.selectedId);
  const { ticker, frame } = instance;
  const isSelected = selectedId === instance.id;

  const devPercent = (frame.deviation * 100).toFixed(1);
  const devSign = frame.deviation >= 0 ? '+' : '';
  const devColor = frame.deviation >= 0 ? sol.green : sol.red;
  const accentColor = CLASS_COLORS[ticker.class] ?? sol.cyan;

  return (
    <div style={{
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      // Offset below face + 3D rings (projected at face center, push label to chin level)
      transform: 'translate(-50%, 40px)',
    }}>
      {/* Ticker label */}
      <div style={{
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        color: isSelected ? '#fdf6e3' : theme.textBright,
        textShadow: '0 1px 4px rgba(0,0,0,0.9)',
        lineHeight: 1,
      }}>
        {ticker.id}
      </div>
      {/* Asset class accent bar */}
      <div style={{
        width: 16,
        height: 2,
        background: accentColor,
        borderRadius: 1,
        opacity: 0.7,
      }} />
      {/* Deviation readout */}
      <div style={{
        fontSize: 8,
        fontFamily: 'monospace',
        color: devColor,
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        lineHeight: 1,
      }}>
        {devSign}{devPercent}%
      </div>
    </div>
  );
}
