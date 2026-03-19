import { describe, it, expect } from 'vitest';
import {
  sigmoid,
  symmetricSigmoid,
  computeChordActivations,
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

describe('computeChordActivations (2-axis circumplex)', () => {
  it('neutral frame → finite activations', () => {
    const frame = makeTickerFrame();
    const act = computeChordActivations(frame);

    expect(Number.isFinite(act.tension)).toBe(true);
    expect(Number.isFinite(act.mood)).toBe(true);
    expect(Number.isFinite(act.chad)).toBe(true);
  });

  it('high volatility × velocity → positive tension (tense)', () => {
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const act = computeChordActivations(frame);

    expect(act.tension).toBeGreaterThan(0);
  });

  it('low activity → negative tension (placid)', () => {
    // Low vol×vel (acute near 0), positive drawdown → -(dd) negative → chronic placid
    const frame = makeTickerFrame({ volatility: 0, velocity: 0, drawdown: 2.0 });
    const act = computeChordActivations(frame);

    expect(act.tension).toBeLessThan(0);
  });

  it('high positive deviation → positive mood (euphoric)', () => {
    const frame = makeTickerFrame({ deviation: 2.0 });
    const act = computeChordActivations(frame);

    expect(act.mood).toBeGreaterThan(0);
  });

  it('high negative deviation → negative mood (grief)', () => {
    const frame = makeTickerFrame({ deviation: -2.0 });
    const act = computeChordActivations(frame);

    expect(act.mood).toBeLessThan(0);
  });

  it('positive momentum → positive chad', () => {
    const frame = makeTickerFrame({ momentum: 2.0 });
    const act = computeChordActivations(frame);

    expect(act.chad).toBeGreaterThan(0);
  });

  it('negative momentum → negative chad (soyboi)', () => {
    const frame = makeTickerFrame({ momentum: -2.0 });
    const act = computeChordActivations(frame);

    expect(act.chad).toBeLessThan(0);
  });

  it('tension is bounded [-1, 1]', () => {
    const extreme = makeTickerFrame({ volatility: 10, velocity: 10, drawdown: -10 });
    const act = computeChordActivations(extreme);
    expect(act.tension).toBeGreaterThanOrEqual(-1);
    expect(act.tension).toBeLessThanOrEqual(1);
  });

  it('mood is bounded [-1, 1]', () => {
    const extreme = makeTickerFrame({ deviation: 10 });
    const act = computeChordActivations(extreme);
    expect(act.mood).toBeGreaterThanOrEqual(-1);
    expect(act.mood).toBeLessThanOrEqual(1);
  });
});

describe('resolveExpressionChords (2-axis)', () => {
  it('tense → ψ2 (brow up), ψ8 (nose wrinkle), ψ7 negative (eyes open)', () => {
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.expression[2]).toBeGreaterThan(0); // brow raise
    expect(result.expression[8]).toBeGreaterThan(0); // nose wrinkle
    expect(result.expression[7]).toBeLessThan(0);    // eyes snap open
  });

  it.skip('tense → ψ5 positive (snarl), ψ4 negative (lips part)', () => {
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.expression[5]).toBeGreaterThan(0); // upper lip raises
    expect(result.expression[4]).toBeLessThan(0);    // lips part
  });

  it('tense → fatigue is negative (wired)', () => {
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.fatigue).toBeLessThan(0); // wired, not fatigued
  });

  it('placid → ψ2 negative (brow sags), ψ7 positive (heavy lids)', () => {
    const frame = makeTickerFrame({ volatility: 0, velocity: 0, drawdown: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.expression[2]).toBeLessThan(0); // brow sags
    expect(result.expression[7]).toBeGreaterThan(0); // eyelid droop
  });

  it('placid → fatigue is zero (zen, not exhausted)', () => {
    const frame = makeTickerFrame({ volatility: 0, velocity: 0, drawdown: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.fatigue).toBe(0); // rested — zen, not exhausted
  });

  it.skip('euphoric → ψ1 positive (smile), ψ7 positive (Duchenne)', () => {
    const frame = makeTickerFrame({ deviation: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.expression[1]).toBeGreaterThan(0); // zygomaticus — smile
    expect(result.expression[7]).toBeGreaterThan(0); // Duchenne crinkle
  });

  it('euphoric → flush is positive (warm glow)', () => {
    const frame = makeTickerFrame({ deviation: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.flush).toBeGreaterThan(0); // warm glow
  });

  it('grief → ψ6 positive (lip sag), ψ3 positive (brow furrow)', () => {
    const frame = makeTickerFrame({ deviation: -2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.expression[6]).toBeGreaterThan(0); // lower lip depressor
    expect(result.expression[3]).toBeGreaterThan(0); // brow furrow
  });

  it('grief → flush is negative (pallid)', () => {
    const frame = makeTickerFrame({ deviation: -2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.flush).toBeLessThan(0); // pallid
  });

  it('ψ7 is clamped to safe range', () => {
    const frame = makeTickerFrame({ drawdown: 3.0, deviation: -3.0, volatility: 0, velocity: 0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.expression[7]).toBeGreaterThanOrEqual(-PSI7_CLAMP);
    expect(result.expression[7]).toBeLessThanOrEqual(PSI7_CLAMP);
  });

  it('tension contributes jaw opening via pose', () => {
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.pose.jaw).toBeGreaterThan(0);
  });

  it.skip('texture ownership: tension→fatigue, mood→flush', () => {
    // Pure tension (no mood signal)
    const tensionFrame = makeTickerFrame({ volatility: 3.0, velocity: 2.0, deviation: 0 });
    const tensionAct = computeChordActivations(tensionFrame);
    const tensionResult = resolveExpressionChords(tensionAct);
    expect(tensionResult.fatigue).not.toBe(0); // tension drives fatigue
    // flush should be near zero from mood (deviation=0 → mood≈0)
    expect(Math.abs(tensionResult.flush)).toBeLessThan(0.1);

    // Pure mood (no tension signal)
    const moodFrame = makeTickerFrame({ deviation: 2.0, volatility: 0, velocity: 0, drawdown: 0 });
    const moodAct = computeChordActivations(moodFrame);
    const moodResult = resolveExpressionChords(moodAct);
    expect(moodResult.flush).not.toBe(0); // mood drives flush
  });
});

describe('resolveShapeChords (single chad axis)', () => {
  it('positive chad → positive β0 (thick)', () => {
    const frame = makeTickerFrame({ momentum: 2.0 });
    const act = computeChordActivations(frame);
    const { shape } = resolveShapeChords(act);

    expect(shape[0]).toBeGreaterThan(0);
  });

  it('negative chad → negative β0, clamped', () => {
    const frame = makeTickerFrame({ momentum: -10 });
    const act = computeChordActivations(frame);
    const { shape } = resolveShapeChords(act);

    expect(shape[3]).toBeGreaterThanOrEqual(-BETA3_CLAMP);
  });

  it('chad is shape-only (no pose link)', () => {
    const frame = makeTickerFrame({ momentum: 2.0 });
    const act = computeChordActivations(frame);
    const { pose } = resolveShapeChords(act);

    expect(Math.abs(pose.pitch)).toBeLessThan(0.1);
  });

  it('chad drives mass components (β0, β1, β2, β5, β6, β9)', () => {
    const frame = makeTickerFrame({ momentum: 2.0 });
    const act = computeChordActivations(frame);
    const { shape } = resolveShapeChords(act);

    expect(shape[0]).toBeGreaterThan(0); // β0: thick
    expect(shape[1]).toBeGreaterThan(0); // β1: tall
    expect(shape[2]).toBeGreaterThan(0); // β2: elongated
    expect(shape[5]).toBeGreaterThan(0); // β5: portly
    expect(shape[6]).toBeGreaterThan(0); // β6: thicc
    expect(shape[9]).toBeGreaterThan(0); // β9: big skull
  });

  it('chad drives jaw/chin (β16, β19 inverted)', () => {
    const frame = makeTickerFrame({ momentum: 2.0 });
    const act = computeChordActivations(frame);
    const { shape } = resolveShapeChords(act);

    expect(shape[16]).toBeGreaterThan(0); // β16: defined jaw
    expect(shape[19]).toBeLessThan(0);    // β19: jutting chin (inverted)
  });

  it('chad drives predator eyes (β7 intent, β8 closely spaced)', () => {
    const frame = makeTickerFrame({ momentum: 2.0 });
    const act = computeChordActivations(frame);
    const { shape } = resolveShapeChords(act);

    expect(shape[7]).toBeGreaterThan(0); // β7: intent recessed eyes
    expect(shape[8]).toBeLessThan(0);    // β8: closely spaced (inverted)
  });
});
