/* eslint-disable */
// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  sigmoid,
  symmetricSigmoid,
  computeCircumplex,
  resolveExpressionChords,
  resolveShapeChords,
} from '../chords';
import { makeTickerFrame } from '../../../test-utils/fixtures';
import { PSI7_CLAMP, BETA3_CLAMP } from '../../constants';

describe('math utilities', () => {
  it('sigmoid maps 0 to 0.5', () => {
    expect(sigmoid(0, 6)).toBeCloseTo(0.5);
  });

  it('sigmoid is bounded [0, 1]', () => {
    expect(sigmoid(-100, 6)).toBeGreaterThanOrEqual(0);
    expect(sigmoid(100, 6)).toBeLessThanOrEqual(1);
    expect(sigmoid(-5, 6)).toBeGreaterThan(0);
    expect(sigmoid(5, 6)).toBeLessThan(1);
  });

  it('symmetricSigmoid maps 0 to 0', () => {
    expect(symmetricSigmoid(0, 6)).toBeCloseTo(0);
  });

  it('symmetricSigmoid is bounded [-1, 1]', () => {
    expect(symmetricSigmoid(-100, 6)).toBeGreaterThanOrEqual(-1);
    expect(symmetricSigmoid(100, 6)).toBeLessThanOrEqual(1);
    expect(symmetricSigmoid(-5, 6)).toBeGreaterThan(-1);
    expect(symmetricSigmoid(5, 6)).toBeLessThan(1);
  });
});

describe('computeCircumplex (2-axis expression + 1 shape)', () => {
  it('neutral frame → finite activations', () => {
    const frame = makeTickerFrame();
    const act = computeCircumplex(frame);

    expect(Number.isFinite(act.tension)).toBe(true);
    expect(Number.isFinite(act.valence)).toBe(true);
    expect(Number.isFinite(act.stature)).toBe(true);
  });

  it('high volatility × velocity → positive tension (tense)', () => {
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const act = computeCircumplex(frame);

    expect(act.tension).toBeGreaterThan(0);
  });

  it('low activity → negative tension (calm)', () => {
    const frame = makeTickerFrame({ volatility: 0, velocity: 0 });
    const act = computeCircumplex(frame);

    // vol_z × |vel_z| = 0, + |dd_z| = 0 - 0.8 = -0.8 → negative tension (calm)
    expect(act.tension).toBeLessThan(0);
  });

  it('high positive deviation → positive valence (good)', () => {
    const frame = makeTickerFrame({ deviation: 2.0 });
    const act = computeCircumplex(frame);

    expect(act.valence).toBeGreaterThan(0);
  });

  it('high negative deviation → negative valence (bad)', () => {
    const frame = makeTickerFrame({ deviation: -2.0 });
    const act = computeCircumplex(frame);

    expect(act.valence).toBeLessThan(0);
  });

  it('all activations bounded [-1, 1]', () => {
    const extreme = makeTickerFrame({ volatility: 10, velocity: 10, deviation: 10, drawdown: -10, mean_reversion_z: 10 });
    const act = computeCircumplex(extreme);
    expect(act.tension).toBeGreaterThanOrEqual(-1);
    expect(act.tension).toBeLessThanOrEqual(1);
    expect(act.valence).toBeGreaterThanOrEqual(-1);
    expect(act.valence).toBeLessThanOrEqual(1);
    expect(act.stature).toBeGreaterThanOrEqual(-1);
    expect(act.stature).toBeLessThanOrEqual(1);
  });
});

describe('resolveExpressionChords (circumplex)', () => {
  it('tense → upper face activation (wide eyes, raised brow)', () => {
    const act = { tension: 0.8, valence: 0, stature: 0 };
    const result = resolveExpressionChords(act);

    expect(result.expression[9]).toBeGreaterThan(0);  // eyes wide
    expect(result.expression[4]).toBeLessThan(0);     // brow raised (negative = raised)
    expect(result.expression[21]).toBeGreaterThan(0); // alert
  });

  it('good valence → lower face activation (smile, corners up, warm)', () => {
    const act = { tension: 0, valence: 0.8, stature: 0 };
    const result = resolveExpressionChords(act);

    expect(result.expression[0]).toBeGreaterThan(0);  // smile
    expect(result.expression[7]).toBeGreaterThan(0);  // corners up
    expect(result.flush).toBeGreaterThan(0);           // warm flush
  });

  it('bad valence → lower face activation (frown, pallor)', () => {
    const act = { tension: 0, valence: -0.8, stature: 0 };
    const result = resolveExpressionChords(act);

    expect(result.expression[7]).toBeLessThan(0);     // corners down
    expect(result.flush).toBeLessThan(0);              // pallid
  });

  it('tension does NOT affect valence-owned ψ components (zero crosstalk)', () => {
    const act = { tension: 1.0, valence: 0, stature: 0 };
    const result = resolveExpressionChords(act);

    // Valence-owned: ψ0, ψ2, ψ3, ψ6, ψ7, ψ16, ψ26
    expect(result.expression[0]).toBe(0);
    expect(result.expression[2]).toBe(0);
    expect(result.expression[3]).toBe(0);
    expect(result.expression[6]).toBe(0);
    expect(result.expression[7]).toBe(0);
    expect(result.expression[16]).toBe(0);
    expect(result.expression[26]).toBe(0);
  });

  it('valence does NOT affect tension-owned ψ components (zero crosstalk)', () => {
    const act = { tension: 0, valence: 1.0, stature: 0 };
    const result = resolveExpressionChords(act);

    // Tension-owned: ψ4, ψ5, ψ9, ψ20, ψ21, ψ24, ψ25
    expect(result.expression[4]).toBe(0);
    expect(result.expression[5]).toBe(0);
    expect(result.expression[9]).toBe(0);
    expect(result.expression[20]).toBe(0);
    expect(result.expression[21]).toBe(0);
    expect(result.expression[24]).toBe(0);
    expect(result.expression[25]).toBe(0);
  });

  it('ψ7 is clamped to safe range', () => {
    const act = { tension: 0, valence: -1, stature: 0 };
    const result = resolveExpressionChords(act);

    expect(result.expression[7]).toBeGreaterThanOrEqual(-PSI7_CLAMP);
    expect(result.expression[7]).toBeLessThanOrEqual(PSI7_CLAMP);
  });
});

describe('resolveShapeChords (stature)', () => {
  it('positive stature → positive β0 (titan)', () => {
    const act = { tension: 0, valence: 0, stature: 0.8 };
    const { shape } = resolveShapeChords(act);

    expect(shape[0]).toBeGreaterThan(0);
  });

  it('negative stature → negative β0 (sprite), clamped', () => {
    const act = { tension: 0, valence: 0, stature: -1 };
    const { shape } = resolveShapeChords(act);

    expect(shape[3]).toBeGreaterThanOrEqual(-BETA3_CLAMP);
  });

  it('skinAge is always 0 (dropped)', () => {
    const act = { tension: 0, valence: 0, stature: 1 };
    const { skinAge } = resolveShapeChords(act);
    expect(skinAge).toBe(0);
  });
});
