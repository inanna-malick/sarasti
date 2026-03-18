import { describe, it, expect } from 'vitest';
import './__tests__/setup-directions';
import { generateReport, type BindingReport, type BindingEntry } from './report';
import { resolve, resolveWithReport } from './resolve';
import { makeTickerFrame, TEST_TICKERS } from '../../test-utils/fixtures';
import { N_SHAPE, N_EXPR } from '../constants';
import { DEFAULT_BINDING_CONFIG } from './config';

function sumContributions(entry: BindingEntry): number {
  return entry.contributions.reduce((sum, c) => sum + c.contribution, 0);
}

describe('BindingReport', () => {
  const ticker = TEST_TICKERS[0];
  const frame = makeTickerFrame({ deviation: -1.5, velocity: -0.8, volatility: 2.5, momentum: 1.0 });

  it('generates a report with all sections', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    expect(report.tickerId).toBe(ticker.id);
    expect(report.shape).toBeDefined();
    expect(report.expression).toBeDefined();
    expect(report.pose).toBeDefined();
    expect(report.gaze).toBeDefined();
    expect(report.flush).toBeDefined();
    expect(report.fatigue).toBeDefined();
  });

  it('shape contributions sum to reported values and match resolved params', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    for (const entry of report.shape) {
      const sum = sumContributions(entry);
      expect(sum).toBeCloseTo(entry.value, 5);
      expect(entry.value).toBeCloseTo(params.shape[entry.index], 5);
    }
  });

  it('expression contributions sum to reported values and match resolved params', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    for (const entry of report.expression) {
      const sum = sumContributions(entry);
      expect(sum).toBeCloseTo(entry.value, 5);
      expect(entry.value).toBeCloseTo(params.expression[entry.index], 5);
    }
  });

  it('shape entries trace stature source', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    const statureEntry = report.shape.find(e => e.contributions.some(c => c.source === 'stature'));
    expect(statureEntry).toBeDefined();
  });

  it('expression entries trace joy source', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    const joyEntry = report.expression.find(e => e.contributions.some(c => c.source === 'joy'));
    expect(joyEntry).toBeDefined();
  });

  it('pose entries have correct sources', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    expect(report.pose.pitch.contributions[0].source).toBe('pitch');
    expect(report.pose.pitch.value).toBe(params.pose.neck[0]);
  });

  it('flush/fatigue entries reflect params', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    expect(report.flush.value).toBe(params.flush);
    expect(report.fatigue.value).toBe(params.fatigue);
  });
});

describe('resolveWithReport', () => {
  it('returns both params and report', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ deviation: -1.0, velocity: -0.5, volatility: 2.0, momentum: 0.5 });

    const { params, report } = resolveWithReport(ticker, frame);

    expect(params.shape.length).toBe(N_SHAPE);
    expect(params.expression.length).toBe(N_EXPR);
    expect(report.tickerId).toBe(ticker.id);
    expect(report.shape.length).toBeGreaterThan(0);
    expect(report.expression.length).toBeGreaterThan(0);
  });
});
