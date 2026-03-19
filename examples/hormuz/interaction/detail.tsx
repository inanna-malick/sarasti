import React, { useState } from 'react';
import { useStore } from '../../../src/store';
import { getTickerTimeseries } from '../../../src/data/loader';
import type { TickerFrame } from '../../../src/types';
import { computeDatasetStats, type DatasetStats, type TickerStats } from '../../../src/data/stats';
import { computeChordActivations } from '../../../src/binding/chords';
import type { ChordActivations } from '../../../src/binding/chords';

/**
 * Detail panel: click face → side panel with full decode.
 *
 * Displays:
 * - Ticker name, id, class, family, age, tenor
 * - Sparkline: ticker's full timeseries
 * - 5 chord bars with winner highlighting
 * - Collapsible raw signals section
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

      {/* Chord bars */}
      <ChordsSection frame={frame} tickerId={ticker.id} />

      {/* Expression decode */}
      <Section title="market dynamics">
        <div style={{ color: '#aaa' }}>
          {describeExpression(frame.deviation, frame.velocity, frame.volatility)}
        </div>
      </Section>

      {/* Collapsible raw signals */}
      <RawSignalsSection frame={frame} />

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

/** Cache dataset stats (computed once). */
let cachedStats: DatasetStats | null = null;
function getStats(): DatasetStats | null {
  const dataset = useStore.getState().dataset;
  if (!dataset) return null;
  if (!cachedStats) {
    cachedStats = computeDatasetStats(dataset);
  }
  return cachedStats;
}

/** Chord activation bars — 2-axis circumplex + 2 shape axes. */
function ChordsSection({ frame, tickerId }: { frame: TickerFrame; tickerId: string }) {
  const stats = getStats();
  const activations = computeChordActivations(frame, stats ?? undefined, tickerId);

  return (
    <>
      <Section title="expression axes">
        <ChordBar
          name="tension"
          weight={Math.abs(activations.tension)}
          rawActivation={activations.tension}
          sign={Math.sign(activations.tension) || 1}
          isWinner={false}
        />
        <ChordBar
          name="mood"
          weight={Math.abs(activations.mood)}
          rawActivation={activations.mood}
          sign={Math.sign(activations.mood) || 1}
          isWinner={false}
        />
      </Section>
      <Section title="shape axes">
        <ChordBar
          name="dominance"
          weight={Math.abs(activations.dominance)}
          rawActivation={activations.dominance}
          sign={Math.sign(activations.dominance) || 1}
          isWinner={false}
        />
        <ChordBar
          name="predator"
          weight={Math.abs(activations.predator)}
          rawActivation={activations.predator}
          sign={Math.sign(activations.predator) || 1}
          isWinner={false}
        />
      </Section>
    </>
  );
}

/** Single chord bar with activation strength. */
function ChordBar({
  name,
  weight,
  rawActivation,
  sign,
  isWinner,
}: {
  name: string;
  weight: number;
  rawActivation: number;
  sign: number;
  isWinner: boolean;
}) {
  const barWidth = 120;
  const barHeight = 8;
  const fillWidth = Math.min(1, weight) * barWidth;

  const color = isWinner
    ? 'rgba(255, 200, 80, 0.9)'
    : sign > 0
      ? 'rgba(100, 200, 255, 0.6)'
      : 'rgba(255, 100, 100, 0.6)';

  const signLabel = name === 'tension'
    ? (sign > 0 ? ' (tense)' : ' (placid)')
    : name === 'mood'
      ? (sign > 0 ? ' (euphoric)' : ' (grief)')
      : name === 'dominance'
        ? (sign > 0 ? ' (chad)' : ' (soyboi)')
        : name === 'predator'
          ? (sign > 0 ? ' (hunter)' : ' (prey)')
          : '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{
        color: isWinner ? '#ffc850' : '#888',
        width: 72,
        flexShrink: 0,
        fontSize: 11,
        fontWeight: isWinner ? 'bold' : 'normal',
      }}>
        {name}
      </span>
      <svg width={barWidth} height={barHeight} style={{ flexShrink: 0 }}>
        <rect width={barWidth} height={barHeight} fill="rgba(255,255,255,0.05)" rx={2} />
        <rect width={fillWidth} height={barHeight} fill={color} rx={2} />
      </svg>
      <span style={{ color: '#ccc', fontSize: 10, flexShrink: 0, width: 32, textAlign: 'right' }}>
        {(weight * 100).toFixed(0)}%
      </span>
      <span style={{ color: '#555', fontSize: 9, flexShrink: 0 }}>
        {signLabel}
      </span>
    </div>
  );
}

/** Collapsible raw signals section. */
function RawSignalsSection({ frame }: { frame: TickerFrame }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          color: '#555',
          cursor: 'pointer',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 1,
          padding: '4px 0',
          fontFamily: 'monospace',
        }}
      >
        {open ? '▾' : '▸'} raw signals
      </button>
      {open && (
        <div style={{ paddingLeft: 8 }}>
          <KV label="close" value={frame.close.toFixed(2)} />
          <KV label="deviation" value={`${frame.deviation >= 0 ? '+' : ''}${(frame.deviation * 100).toFixed(1)}%`} />
          <KV label="velocity" value={frame.velocity.toFixed(4)} />
          <KV label="volatility" value={frame.volatility.toFixed(4)} />
          <KV label="drawdown" value={`${(frame.drawdown * 100).toFixed(1)}%`} />
          <KV label="momentum" value={frame.momentum.toFixed(3)} />
          <KV label="mean_rev_z" value={frame.mean_reversion_z.toFixed(3)} />
          <KV label="beta" value={frame.beta.toFixed(3)} />
        </div>
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
    parts.push('Stable — near baseline.');
  } else if (deviation < -0.1) {
    parts.push(`Significant Drawdown — ${(absDev * 100).toFixed(0)}% below baseline.`);
  } else if (deviation < 0) {
    parts.push(`Minor Deviation — ${(absDev * 100).toFixed(0)}% below baseline.`);
  } else if (deviation > 0.1) {
    parts.push(`Positive Surge — ${(absDev * 100).toFixed(0)}% above baseline.`);
  } else {
    parts.push(`Minor Positive — ${(absDev * 100).toFixed(0)}% above baseline.`);
  }

  if (Math.abs(velocity) > 0.1) {
    parts.push(velocity < 0 ? 'Rapid decline indicates market pressure.' : 'Positive momentum indicates recovery.');
  }

  if (volatility > 1) {
    parts.push('Elevated volatility detected.');
  }

  return parts.join(' ');
}
