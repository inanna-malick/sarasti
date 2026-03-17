import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve as pathResolve } from 'path';
import type { TimelineDataset, Frame, FaceInstance } from '../types';
import { parseDataset, getFrameAtTime } from '../data/loader';
import { createResolver } from '../binding/resolve';
import { computeLayout } from '../spatial/layout';
import { N_SHAPE, N_EXPR } from '../constants';

function loadRealDataset(): TimelineDataset {
  const raw = JSON.parse(
    readFileSync(pathResolve(__dirname, '../../public/data/market-data.json'), 'utf-8'),
  );
  return parseDataset(raw);
}

function buildInstances(
  dataset: TimelineDataset,
  frame: Frame,
  positions: Map<string, [number, number, number]>,
): FaceInstance[] {
  const resolver = createResolver();
  const instances: FaceInstance[] = [];

  for (const ticker of dataset.tickers) {
    const tickerFrame = frame.values[ticker.id];
    if (!tickerFrame) continue;
    const pos = positions.get(ticker.id);
    if (!pos) continue;

    instances.push({
      id: ticker.id,
      params: resolver.resolve(ticker, tickerFrame),
      position: pos,
      ticker,
      frame: tickerFrame,
    });
  }

  return instances;
}

function assertNoNaN(arr: Float32Array, label: string) {
  for (let i = 0; i < arr.length; i++) {
    expect(arr[i], `${label}[${i}] is NaN`).not.toBeNaN();
    expect(isFinite(arr[i]), `${label}[${i}] is not finite`).toBe(true);
  }
}

describe('root integration: data → binding → spatial → instances', () => {
  const dataset = loadRealDataset();
  const layout = computeLayout(dataset.tickers, { kind: 'family-rows' });

  it('loads dataset with tickers and frames', () => {
    expect(dataset.tickers.length).toBeGreaterThanOrEqual(20);
    expect(dataset.frames.length).toBeGreaterThanOrEqual(100);
    expect(dataset.timestamps.length).toBe(dataset.frames.length);
  });

  it('layout assigns positions to all tickers', () => {
    for (const ticker of dataset.tickers) {
      expect(layout.positions.has(ticker.id), `missing position for ${ticker.id}`).toBe(true);
    }
  });

  const timestamps = [
    { label: 'pre-crisis', time: '2026-02-25T12:00:00Z' },
    { label: 'strike onset', time: '2026-02-28T00:00:00Z' },
    { label: 'sustained', time: '2026-03-05T00:00:00Z' },
  ];

  for (const { label, time } of timestamps) {
    describe(`at ${label} (${time})`, () => {
      const frame = getFrameAtTime(dataset, time);
      const instances = buildInstances(dataset, frame, layout.positions);

      it('resolves all tickers to instances', () => {
        expect(instances.length).toBeGreaterThanOrEqual(20);
      });

      it('all FaceParams have correct dimensions', () => {
        for (const inst of instances) {
          expect(inst.params.shape.length).toBe(N_SHAPE);
          expect(inst.params.expression.length).toBe(N_EXPR);
        }
      });

      it('no NaN or Infinity in shape params', () => {
        for (const inst of instances) {
          assertNoNaN(inst.params.shape, `${inst.id}.shape`);
        }
      });

      it('no NaN or Infinity in expression params', () => {
        for (const inst of instances) {
          assertNoNaN(inst.params.expression, `${inst.id}.expression`);
        }
      });

      it('all positions are finite', () => {
        for (const inst of instances) {
          for (let i = 0; i < 3; i++) {
            expect(isFinite(inst.position[i]), `${inst.id}.position[${i}]`).toBe(true);
          }
        }
      });
    });
  }

  describe('expression varies across timestamps', () => {
    const frame0 = getFrameAtTime(dataset, '2026-02-25T12:00:00Z');
    const frame1 = getFrameAtTime(dataset, '2026-02-28T00:00:00Z');
    const inst0 = buildInstances(dataset, frame0, layout.positions);
    const inst1 = buildInstances(dataset, frame1, layout.positions);

    it('at least some faces have different expressions at different times', () => {
      let diffCount = 0;
      for (const i0 of inst0) {
        const i1 = inst1.find(i => i.id === i0.id);
        if (!i1) continue;
        let diff = 0;
        for (let j = 0; j < N_EXPR; j++) {
          diff += Math.abs(i0.params.expression[j] - i1.params.expression[j]);
        }
        if (diff > 0.01) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(0);
    });
  });

  describe('shape is consistent across timestamps (structural identity)', () => {
    const frame0 = getFrameAtTime(dataset, '2026-02-25T12:00:00Z');
    const frame1 = getFrameAtTime(dataset, '2026-03-05T00:00:00Z');
    const inst0 = buildInstances(dataset, frame0, layout.positions);
    const inst1 = buildInstances(dataset, frame1, layout.positions);

    it('same ticker has identical shape at different times', () => {
      for (const i0 of inst0) {
        const i1 = inst1.find(i => i.id === i0.id);
        if (!i1) continue;
        for (let j = 0; j < N_SHAPE; j++) {
          expect(i0.params.shape[j]).toBe(i1.params.shape[j]);
        }
      }
    });
  });
});
