import { describe, it, expect, vi } from 'vitest';
import './__tests__/setup-directions';
import { generateReport, type BindingReport, type BindingEntry } from './report';
import { resolve, resolveWithReport } from './resolve';
import { makeTickerFrame, TEST_TICKERS } from '../../test-utils/fixtures';
import { N_SHAPE, N_EXPR } from '../constants';
import { DEFAULT_BINDING_CONFIG } from './config';
import type { TickerStatic } from '../types';

// Use the same direction mocks as resolve.test.ts
vi.mock('./directions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./directions')>();
  return {
    ...actual,
    getTable: (axis: string) => ({
      axis,
      space: axis === 'age' || axis === 'build' ? 'shape' : 'expression',
      dims: 100,
      points: [
        { t: -3, params: new Array(100).fill(0).map((_, i) => (i === 0 && axis === 'age') || (i === 1 && axis === 'build') ? -1 : 0) },
        { t: 3, params: new Array(100).fill(0).map((_, i) => (i === 0 && axis === 'age') || (i === 1 && axis === 'build') ? 1 : 0) },
      ],
    }),
    getIdentityBasis: () => ({
      dims: 100,
      n_basis: 10,
      vectors: new Array(10).fill(0).map((_, b) =>
        new Array(100).fill(0).map((_, i) => i === 10 + b ? 1 : 0)
      ),
    }),
  };
});

function sumContributions(entry: BindingEntry): number {
  return entry.contributions.reduce((sum, c) => sum + c.contribution, 0);
}

describe('BindingReport', () => {
  const ticker = TEST_TICKERS[0]; // energy, age 20
  const frame = makeTickerFrame({ deviation: -1.5, velocity: -0.8, volatility: 2.5 });

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
      // Verify report value matches actual resolved output
      expect(entry.value).toBeCloseTo(params.shape[entry.index], 5);
    }
  });

  it('expression contributions sum to reported values and match resolved params', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    for (const entry of report.expression) {
      const sum = sumContributions(entry);
      expect(sum).toBeCloseTo(entry.value, 5);
      // Verify report value matches actual resolved output
      expect(entry.value).toBeCloseTo(params.expression[entry.index], 5);
    }
  });

  it('shape entries trace semantify:age source for age-sensitive components', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    // With mock tables, age only affects component 0
    const ageEntry = report.shape.find(e => e.index === 0);
    expect(ageEntry).toBeDefined();
    const ageSrc = ageEntry!.contributions.find(c => c.source === 'semantify:age');
    expect(ageSrc).toBeDefined();
    expect(ageSrc!.input).toBe(ticker.age);
  });

  it('shape entries trace semantify:build source', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    // With mock tables, build only affects component 1
    const buildEntry = report.shape.find(e => e.index === 1);
    expect(buildEntry).toBeDefined();
    const buildSrc = buildEntry!.contributions.find(c => c.source === 'semantify:build');
    expect(buildSrc).toBeDefined();
  });

  it('shape entries trace semantify:identity source', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    // With mock identity basis, identity affects components 10-19
    const identityEntry = report.shape.find(e => e.index >= 10 && e.index < 20);
    expect(identityEntry).toBeDefined();
    const idSrc = identityEntry!.contributions.find(c => c.source === 'semantify:identity');
    expect(idSrc).toBeDefined();
  });

  it('expression entries trace crisis source for negative deviation', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    // High negative deviation should produce crisis contributions
    const crisisEntries = report.expression.filter(e =>
      e.contributions.some(c => c.source === 'crisis')
    );
    expect(crisisEntries.length).toBeGreaterThan(0);
  });

  it('expression entries trace dynamics source', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    const dynamicsEntries = report.expression.filter(e =>
      e.contributions.some(c => c.source === 'dynamics')
    );
    expect(dynamicsEntries.length).toBeGreaterThan(0);
  });

  it('pose entries have correct sources', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    expect(report.pose.pitch.contributions[0].source).toBe('deviation');
    expect(report.pose.pitch.value).toBe(params.pose.neck[0]);
  });

  it('gaze entries have correct sources', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    expect(report.gaze.horizontal.contributions[0].source).toBe('velocity');
    expect(report.gaze.vertical.contributions[0].source).toBe('volatility');
    expect(report.gaze.horizontal.value).toBe(params.pose.leftEye[0]);
    expect(report.gaze.vertical.value).toBe(params.pose.leftEye[1]);
  });

  it('flush/fatigue entries reflect params', () => {
    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params);

    expect(report.flush.value).toBe(params.flush);
    expect(report.fatigue.value).toBe(params.fatigue);
  });

  it('zero deviation produces minimal expression entries', () => {
    const calmFrame = makeTickerFrame({ deviation: 0, velocity: 0, volatility: 1 });
    const params = resolve(ticker, calmFrame);
    const report = generateReport(ticker, calmFrame, params);

    // With zero deviation and zero velocity, crisis and dynamics should be zero
    const crisisContribs = report.expression.filter(e =>
      e.contributions.some(c => c.source === 'crisis' && Math.abs(c.contribution) > 0.01)
    );
    expect(crisisContribs.length).toBe(0);
  });

  it('statics contributions are traced when provided', () => {
    const statics: TickerStatic = {
      avg_volume: 150000,
      hist_volatility: 0.03,
      corr_to_brent: 0.9,
      corr_to_spy: 0.2,
      skewness: -0.5,
      spread_from_family: 0.05,
    };

    const params = resolve(ticker, frame);
    const report = generateReport(ticker, frame, params, DEFAULT_BINDING_CONFIG, statics);

    const staticsEntries = report.shape.filter(e =>
      e.contributions.some(c => c.source.startsWith('statics:'))
    );
    expect(staticsEntries.length).toBeGreaterThan(0);
  });

  it('different tickers produce different reports', () => {
    const tickerA = TEST_TICKERS[0]; // energy, age 20
    const tickerB = TEST_TICKERS[1]; // fear, age 40

    const paramsA = resolve(tickerA, frame);
    const paramsB = resolve(tickerB, frame);
    const reportA = generateReport(tickerA, frame, paramsA);
    const reportB = generateReport(tickerB, frame, paramsB);

    // Different class → different semantify:build input (energy=1.5, fear=-1.5)
    const buildA = reportA.shape.find(e => e.contributions.some(c => c.source === 'semantify:build'));
    const buildB = reportB.shape.find(e => e.contributions.some(c => c.source === 'semantify:build'));
    expect(buildA).toBeDefined();
    expect(buildB).toBeDefined();
    const buildContribA = buildA!.contributions.find(c => c.source === 'semantify:build')!;
    const buildContribB = buildB!.contributions.find(c => c.source === 'semantify:build')!;
    expect(buildContribA.input).not.toBe(buildContribB.input);
  });
});

describe('resolveWithReport', () => {
  it('returns both params and report', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ deviation: -1.0, velocity: -0.5, volatility: 2.0 });

    const { params, report } = resolveWithReport(ticker, frame);

    expect(params.shape.length).toBe(N_SHAPE);
    expect(params.expression.length).toBe(N_EXPR);
    expect(report.tickerId).toBe(ticker.id);
    expect(report.shape.length).toBeGreaterThan(0);
    expect(report.expression.length).toBeGreaterThan(0);
  });
});
