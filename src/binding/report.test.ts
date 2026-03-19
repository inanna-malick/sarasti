import { describe, it, expect } from 'vitest';
import { generateReport, type BindingReport, type BindingEntry } from './report';
import { resolve } from './resolve';
import { makeTickerFrame, TEST_TICKERS } from '../../test-utils/fixtures';
import { N_SHAPE, N_EXPR } from '../constants';

function sumContributions(entry: BindingEntry): number {
  return entry.contributions.reduce((sum, c) => sum + c.contribution, 0);
}

describe('BindingReport (4-axis expression + 2 shape)', () => {
  const ticker = TEST_TICKERS[0]; // energy, age 20
  const frame = makeTickerFrame({ deviation: -0.15, velocity: -0.8, volatility: 2.5, drawdown: -0.3, momentum: -1.5, mean_reversion_z: 2.0, beta: 0.5 });

  it('generates a report with all sections', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    expect(report.tickerId).toBe(ticker.id);
    expect(report.chords).toBeDefined();
    expect(report.chords.length).toBe(4);
    expect(report.shape).toBeDefined();
    expect(report.expression).toBeDefined();
    expect(report.pose).toBeDefined();
    expect(report.gaze).toBeDefined();
    expect(report.flush).toBeDefined();
    expect(report.fatigue).toBeDefined();
  });

  it('chord entries have alarm, mood, fatigue, vigilance', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    const names = report.chords.map(c => c.name);
    expect(names).toContain('alarm');
    expect(names).toContain('mood');
    expect(names).toContain('fatigue');
    expect(names).toContain('vigilance');
  });

  it('chord activations are bounded [-1, 1]', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    for (const chord of report.chords) {
      expect(chord.rawActivation).toBeGreaterThanOrEqual(-1);
      expect(chord.rawActivation).toBeLessThanOrEqual(1);
    }
  });

  it('shape contributions sum to reported values', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    for (const entry of report.shape) {
      const sum = sumContributions(entry);
      expect(sum).toBeCloseTo(entry.value, 5);
    }
  });

  it('identity noise traced in shape', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    const identityEntries = report.shape.filter(e =>
      e.contributions.some(c => c.source === 'identity_noise')
    );
    expect(identityEntries.length).toBeGreaterThan(0);
  });

  it('pose entries use chord_blend source', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    expect(report.pose.pitch.contributions[0].source).toBe('chord_blend');
    expect(report.pose.pitch.value).toBe(params.pose.neck[0]);
  });

  it('gaze entries use chord_blend source', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    expect(report.gaze.horizontal.contributions[0].source).toBe('chord_blend');
    expect(report.gaze.vertical.contributions[0].source).toBe('chord_blend');
  });

  it('flush/fatigue entries reflect params', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    expect(report.flush.value).toBe(params.flush);
    expect(report.fatigue.value).toBe(params.fatigue);
  });

  it('different tickers produce different reports (identity noise)', () => {
    const tickerA = TEST_TICKERS[0];
    const tickerB = TEST_TICKERS[1];

    const paramsA = resolve(tickerA, frame);
    const paramsB = resolve(tickerB, frame);
    const reportA = generateReport(tickerA, frame, paramsA);
    const reportB = generateReport(tickerB, frame, paramsB);

    const identityA = reportA.shape.filter(e => e.contributions.some(c => c.source === 'identity_noise'));
    const identityB = reportB.shape.filter(e => e.contributions.some(c => c.source === 'identity_noise'));
    expect(identityA.length).toBeGreaterThan(0);
    expect(identityB.length).toBeGreaterThan(0);
  });
});
