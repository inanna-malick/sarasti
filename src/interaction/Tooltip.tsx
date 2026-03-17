import React from 'react';
import { useStore } from '../store';
import { getTooltipPosition } from './hover';

/**
 * Tooltip overlay: shows when a face is hovered.
 *
 * Displays:
 * - Ticker name + id
 * - Asset class + family
 * - Current values: close, deviation, velocity, volatility
 * - "Why is this face screaming?" section:
 *     deviation from baseline: +47%
 *     velocity: -2.3σ/hr (sharp drop)
 *     volatility: 4.1× normal
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
        background: 'rgba(10, 10, 10, 0.92)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 6,
        padding: '10px 12px',
        color: '#e0e0e0',
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
      <div style={{ color: '#888', marginBottom: 6 }}>
        {ticker.id} · {ticker.class} · {ticker.family}
        {ticker.tenor_months != null ? ` · ${ticker.tenor_months}M` : ''}
        {' · age '}{ticker.age}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6 }}>
        <Row label="close" value={frame.close.toFixed(2)} />
        <Row label="deviation" value={`${devSign}${devPercent}%`}
          color={frame.deviation < -0.05 ? '#ff6b6b' : frame.deviation > 0.05 ? '#51cf66' : '#888'} />
        <Row label="velocity" value={frame.velocity.toFixed(3)} />
        <Row label="volatility" value={frame.volatility.toFixed(3)} />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ color: color || '#ccc' }}>{value}</span>
    </div>
  );
}
