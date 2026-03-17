import React from 'react';
import { useStore } from '../store';
import { getTickerTimeseries } from '../data/loader';

/**
 * Detail panel: click face → side panel with full decode.
 *
 * Displays:
 * - Ticker name, id, class, family, age, tenor
 * - Sparkline: ticker's full timeseries (tiny line chart via SVG)
 * - Current frame highlight on sparkline
 * - All binding parameters listed
 * - "What do the expressions represent" decode
 * - Family context: show all family members' current states
 *
 * Reads selectedId + instances + dataset from store.
 * Slides in from right when a face is selected.
 */
export function DetailPanel(): React.ReactElement | null {
  const selectedId = useStore((s) => s.selectedId);
  const instances = useStore((s) => s.instances);
  const dataset = useStore((s) => s.dataset);
  const currentIndex = useStore((s) => s.playback.current_index);

  if (!selectedId || !dataset) return null;

  const instance = instances.find((i) => i.id === selectedId);
  if (!instance) return null;

  const { ticker, frame } = instance;

  // Get timeseries for sparkline
  const timeseries = getTickerTimeseries(dataset, ticker.id);

  // Family members' current states
  const familyMembers = instances.filter(
    (i) => i.ticker.family === ticker.family && i.id !== ticker.id,
  );

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 320,
        background: 'rgba(10, 10, 10, 0.95)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        padding: '16px',
        color: '#e0e0e0',
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.6,
        overflowY: 'auto',
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 'bold' }}>{ticker.name}</div>
        <div style={{ color: '#888' }}>
          {ticker.id} · {ticker.class} · {ticker.family}
        </div>
        <div style={{ color: '#666' }}>
          age {ticker.age}
          {ticker.tenor_months != null ? ` · tenor ${ticker.tenor_months}M` : ''}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => useStore.getState().setSelectedId(null)}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'none',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 4,
          color: '#888',
          cursor: 'pointer',
          padding: '2px 8px',
          fontSize: 12,
        }}
      >
        ×
      </button>

      {/* Sparkline */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#666', marginBottom: 4 }}>deviation over time</div>
        <Sparkline
          data={timeseries.map((f) => f?.deviation ?? 0)}
          currentIndex={currentIndex}
          width={288}
          height={48}
        />
      </div>

      {/* Current values */}
      <Section title="current frame">
        <KV label="close" value={frame.close.toFixed(2)} />
        <KV label="deviation" value={`${frame.deviation >= 0 ? '+' : ''}${(frame.deviation * 100).toFixed(1)}%`} />
        <KV label="velocity" value={frame.velocity.toFixed(4)} />
        <KV label="volatility" value={frame.volatility.toFixed(4)} />
      </Section>

      {/* Expression decode */}
      <Section title="what the face shows">
        <div style={{ color: '#aaa' }}>
          {describeExpression(frame.deviation, frame.velocity, frame.volatility)}
        </div>
      </Section>

      {/* Family context */}
      {familyMembers.length > 0 && (
        <Section title={`family: ${ticker.family}`}>
          {familyMembers.map((m) => (
            <div key={m.id} style={{ marginBottom: 4 }}>
              <span style={{ color: '#ccc' }}>{m.ticker.name}</span>
              <span style={{ color: '#666' }}> age {m.ticker.age}</span>
              <span style={{ color: m.frame.deviation < -0.05 ? '#ff6b6b' : '#888' }}>
                {' '}{m.frame.deviation >= 0 ? '+' : ''}
                {(m.frame.deviation * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

/** Mini SVG sparkline. */
function Sparkline({
  data,
  currentIndex,
  width,
  height,
}: {
  data: number[];
  currentIndex: number;
  width: number;
  height: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const cursorX = (currentIndex / (data.length - 1)) * width;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      {/* Zero line */}
      <line
        x1={0}
        y1={height - ((0 - min) / range) * height}
        x2={width}
        y2={height - ((0 - min) / range) * height}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
        strokeDasharray="2,2"
      />
      {/* Current position marker */}
      <line
        x1={cursorX}
        y1={0}
        x2={cursorX}
        y2={height}
        stroke="rgba(255,200,100,0.6)"
        strokeWidth="1"
      />
    </svg>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          color: '#555',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 4,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 2,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ color: '#ccc' }}>{value}</span>
    </div>
  );
}

/** Human-readable description of what the face's expression represents. */
export function describeExpression(deviation: number, velocity: number, volatility: number): string {
  const parts: string[] = [];

  const absDev = Math.abs(deviation);
  if (absDev < 0.02) {
    parts.push('Calm — near baseline.');
  } else if (deviation < -0.1) {
    parts.push(`Distress — ${(absDev * 100).toFixed(0)}% below baseline.`);
  } else if (deviation < 0) {
    parts.push(`Mild concern — ${(absDev * 100).toFixed(0)}% below baseline.`);
  } else if (deviation > 0.1) {
    parts.push(`Shock/surge — ${(absDev * 100).toFixed(0)}% above baseline.`);
  } else {
    parts.push(`Slight positive — ${(absDev * 100).toFixed(0)}% above baseline.`);
  }

  if (Math.abs(velocity) > 0.1) {
    parts.push(velocity < 0 ? 'Sharp drop amplifies fear.' : 'Rally shifts toward relief.');
  }

  if (volatility > 1) {
    parts.push('High volatility — expression is conflicted.');
  }

  return parts.join(' ');
}
