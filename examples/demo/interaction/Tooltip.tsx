import React from 'react';
import { useStore } from '../../../src/store';
import { getTooltipPosition } from './hover';
import { sol, theme } from '../theme';

/**
 * Tooltip overlay: shows when a face is hovered.
 *
 * Displays:
 * - Ticker name + id
 * - Asset class + family
 * - Current values: close, deviation, velocity, volatility
 *
 * Positions near cursor, avoiding viewport overflow.
 * Reads hoveredId + instances from store.
 */
export function Tooltip(): React.ReactElement | null {
  const hoveredId = useStore((s) => s.hoveredId);
  const instances = useStore((s) => s.instances);

  if (!hoveredId) return null;

  const instance = instances.find((i) => i.id === hoveredId);
  if (!instance) return null;

  const { ticker, frame } = instance;
  const pos = getTooltipPosition();

  // Position tooltip offset from cursor, keep within viewport
  const offsetX = 16;
  const offsetY = 16;
  const tooltipWidth = 280;
  const tooltipHeight = 200;

  let left = pos.x + offsetX;
  let top = pos.y + offsetY;

  if (left + tooltipWidth > window.innerWidth) {
    left = pos.x - tooltipWidth - offsetX;
  }
  if (top + tooltipHeight > window.innerHeight) {
    top = pos.y - tooltipHeight - offsetY;
  }

  const devPercent = (frame.deviation * 100).toFixed(1);
  const devSign = frame.deviation >= 0 ? '+' : '';

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: tooltipWidth,
        background: theme.bgPanelAlpha,
        border: `1px solid ${theme.border}`,
        borderRadius: 6,
        padding: '10px 12px',
        color: theme.textBright,
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.5,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
        {ticker.name}
      </div>
      <div style={{ color: theme.textMuted, marginBottom: 6 }}>
        {ticker.id} · {ticker.class} · {ticker.family}
        {ticker.tenor_months != null ? ` · ${ticker.tenor_months}M` : ''}
        {' · age '}{ticker.age}
      </div>
      <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, paddingTop: 6 }}>
        <Row label="close" value={frame.close.toFixed(2)} />
        <Row label="deviation" value={`${devSign}${devPercent}%`}
          color={frame.deviation < -0.05 ? sol.red : frame.deviation > 0.05 ? sol.green : theme.textMuted} />
        <Row label="velocity" value={frame.velocity.toFixed(3)} />
        <Row label="volatility" value={frame.volatility.toFixed(3)} />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: theme.textMuted }}>{label}</span>
      <span style={{ color: color || theme.text }}>{value}</span>
    </div>
  );
}
