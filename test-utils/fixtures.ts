import type { TickerConfig, TickerFrame, Frame, TimelineDataset, FaceParams } from '../src/types';
import { zeroPose } from '../src/types';
import { N_SHAPE, N_EXPR } from '../src/constants';

// ─── Synthetic test dataset ─────────────────────────

export const TEST_TICKERS: TickerConfig[] = [
  { id: 'TEST_A', name: 'Test Ticker A', class: 'energy', family: 'test', age: 20 },
  { id: 'TEST_B', name: 'Test Ticker B', class: 'fear',   family: 'test', age: 40 },
  { id: 'TEST_C', name: 'Test Ticker C', class: 'equity', family: 'test', age: 60 },
];

export function makeTickerFrame(overrides: Partial<TickerFrame> = {}): TickerFrame {
  return {
    close: 100,
    volume: 1000,
    deviation: 0,
    velocity: 0,
    volatility: 1,
    drawdown: 0,
    momentum: 0,
    mean_reversion_z: 0,
    beta: 1,
    ...overrides,
  };
}

export function makeFrame(timestamp: string, values: Record<string, Partial<TickerFrame>> = {}): Frame {
  const result: Record<string, TickerFrame> = {};
  for (const ticker of TEST_TICKERS) {
    result[ticker.id] = makeTickerFrame(values[ticker.id]);
  }
  return { timestamp, values: result };
}

export function makeTestDataset(): TimelineDataset {
  const timestamps = Array.from({ length: 10 }, (_, i) => {
    const d = new Date('2026-02-25T00:00:00Z');
    d.setHours(d.getHours() + i);
    return d.toISOString();
  });

  const frames = timestamps.map((ts, i) => {
    const crisis = i / 9; // 0 → 1 over 10 frames
    return makeFrame(ts, {
      TEST_A: { deviation: -crisis * 2, velocity: -crisis, volatility: 1 + crisis * 3, drawdown: -crisis * 0.3, momentum: -crisis * 1.5, mean_reversion_z: -crisis * 2, beta: 1.2 + crisis * 0.3 },
      TEST_B: { deviation: crisis * 1.5, velocity: crisis * 0.5, volatility: 1 + crisis * 2, drawdown: 0, momentum: crisis * 1.0, mean_reversion_z: crisis, beta: 0.8 },
      TEST_C: { deviation: -crisis * 0.5, velocity: -crisis * 0.3, volatility: 1 + crisis, drawdown: -crisis * 0.1, momentum: -crisis * 0.3, mean_reversion_z: -crisis * 0.5, beta: 1.0 },
    });
  });

  return {
    tickers: TEST_TICKERS,
    frames,
    timestamps,
    baseline_timestamp: timestamps[0],
  };
}

// ─── Face params helpers ────────────────────────────

export function zeroFaceParams(): FaceParams {
  return {
    shape: new Float32Array(N_SHAPE),
    expression: new Float32Array(N_EXPR),
    pose: zeroPose(),
    flush: 0,
    fatigue: 0,
  };
}

export function randomFaceParams(): FaceParams {
  const shape = new Float32Array(N_SHAPE);
  const expression = new Float32Array(N_EXPR);
  for (let i = 0; i < N_SHAPE; i++) shape[i] = (Math.random() - 0.5) * 2;
  for (let i = 0; i < N_EXPR; i++) expression[i] = (Math.random() - 0.5) * 2;
  return { shape, expression, pose: zeroPose(), flush: 0, fatigue: 0 };
}
