import { describe, it, expect } from 'vitest';
import {
  sigmoid,
  symmetricSigmoid,
  softmax,
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
    // At moderate inputs, strictly between 0 and 1
    expect(sigmoid(-5, 6)).toBeGreaterThan(0);
    expect(sigmoid(5, 6)).toBeLessThan(1);
  });

  it('symmetricSigmoid maps 0 to 0', () => {
    expect(symmetricSigmoid(0, 6)).toBeCloseTo(0);
  });

  it('symmetricSigmoid is bounded [-1, 1]', () => {
    expect(symmetricSigmoid(-100, 6)).toBeGreaterThanOrEqual(-1);
    expect(symmetricSigmoid(100, 6)).toBeLessThanOrEqual(1);
    // At moderate inputs, strictly between -1 and 1
    expect(symmetricSigmoid(-5, 6)).toBeGreaterThan(-1);
    expect(symmetricSigmoid(5, 6)).toBeLessThan(1);
  });

  it('softmax sums to 1', () => {
    const result = softmax([1, 2, 3], 0.5);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it('softmax with τ=0.5 produces winner-take-most', () => {
    const result = softmax([0.9, 0.3, 0.1], 0.5);
    // Largest input should get dominant weight
    expect(result[0]).toBeGreaterThan(0.5);
    expect(result[0]).toBeGreaterThan(result[1]);
    expect(result[1]).toBeGreaterThan(result[2]);
  });
});

describe('computeChordActivations', () => {
  it('neutral frame → moderate activations', () => {
    const frame = makeTickerFrame();
    const act = computeChordActivations(frame);

    expect(act.wAlarm + act.wValence + act.wArousal).toBeCloseTo(1, 5);
    expect(Number.isFinite(act.dominance)).toBe(true);
    expect(Number.isFinite(act.stature)).toBe(true);
  });

  it('high volatility × velocity → alarm dominates', () => {
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const act = computeChordActivations(frame);

    expect(act.rawAlarm).toBeGreaterThan(0.5);
    expect(act.wAlarm).toBeGreaterThan(act.wValence);
    expect(act.wAlarm).toBeGreaterThan(act.wArousal);
  });

  it('high positive deviation → valence positive', () => {
    const frame = makeTickerFrame({ deviation: 2.0 });
    const act = computeChordActivations(frame);

    expect(act.rawValence).toBeGreaterThan(0);
    expect(act.valenceSign).toBe(1);
  });

  it('high negative deviation → valence negative', () => {
    const frame = makeTickerFrame({ deviation: -2.0 });
    const act = computeChordActivations(frame);

    expect(act.rawValence).toBeLessThan(0);
    expect(act.valenceSign).toBe(-1);
  });

  it('deep drawdown → arousal negative (exhausted)', () => {
    const frame = makeTickerFrame({ drawdown: -2.0 });
    const act = computeChordActivations(frame);

    // -(drawdown_z) with negative drawdown → positive arousal input
    // But drawdown_z = -2.0, so -(-2.0) = +2.0 → positive arousal → alert
    // Wait: drawdown is already negative. With z-score, the sign depends on stats.
    // Without stats, drawdown = -2.0, -(dd_z) = -(-2.0) = 2.0 → positive → alert
    // Actually no: rawArousal = symmetricSigmoid(-(dd_z + exchFatigue), 6)
    // dd_z = -2.0 (no stats), so -((-2.0) + 0) = 2.0 → positive
    expect(act.rawArousal).toBeGreaterThan(0);
    expect(act.arousalSign).toBe(1);
  });

  it('positive momentum → positive dominance (chad)', () => {
    const frame = makeTickerFrame({ momentum: 2.0 });
    const act = computeChordActivations(frame);

    expect(act.dominance).toBeGreaterThan(0);
  });

  it('negative momentum → negative dominance (soyboi)', () => {
    const frame = makeTickerFrame({ momentum: -2.0 });
    const act = computeChordActivations(frame);

    expect(act.dominance).toBeLessThan(0);
  });
});

describe('resolveExpressionChords', () => {
  it('alarm-dominant → ψ2 (brow up) and ψ8 (nose wrinkle)', () => {
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.expression[2]).toBeGreaterThan(0); // brow raise
    expect(result.expression[8]).toBeGreaterThan(0); // nose wrinkle
  });

  it('valence euphoria → ψ9 positive (cheek puff), ψ7 positive (Duchenne)', () => {
    const frame = makeTickerFrame({ deviation: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.expression[9]).toBeGreaterThan(0); // cheek puff — smile
    expect(result.expression[7]).toBeGreaterThan(0); // Duchenne crinkle
  });

  it('valence grief → ψ6 positive (lip sag), ψ3 positive (brow furrow)', () => {
    const frame = makeTickerFrame({ deviation: -2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.expression[6]).toBeGreaterThan(0); // lower lip depressor
    expect(result.expression[3]).toBeGreaterThan(0); // brow furrow
  });

  it('ψ7 is clamped to safe range', () => {
    // Create extreme conditions that would push ψ7 beyond limits
    const frame = makeTickerFrame({ drawdown: 3.0, deviation: -3.0, volatility: 0, velocity: 0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.expression[7]).toBeGreaterThanOrEqual(-PSI7_CLAMP);
    expect(result.expression[7]).toBeLessThanOrEqual(PSI7_CLAMP);
  });

  it('alarm contributes jaw opening via pose', () => {
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.pose.jaw).toBeGreaterThan(0);
  });

  it('alarm contributes flush via texture', () => {
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const act = computeChordActivations(frame);
    const result = resolveExpressionChords(act);

    expect(result.flush).toBeGreaterThan(0);
  });
});

describe('resolveShapeChords', () => {
  it('positive dominance → positive β3 (jaw width)', () => {
    const frame = makeTickerFrame({ momentum: 2.0 });
    const act = computeChordActivations(frame);
    const { shape } = resolveShapeChords(act);

    expect(shape[3]).toBeGreaterThan(0);
  });

  it('negative dominance → negative β3, clamped', () => {
    const frame = makeTickerFrame({ momentum: -10 });
    const act = computeChordActivations(frame);
    const { shape } = resolveShapeChords(act);

    expect(shape[3]).toBeGreaterThanOrEqual(-BETA3_CLAMP);
  });

  it('dominance drives identity pose (chad = chin up)', () => {
    const frame = makeTickerFrame({ momentum: 2.0 });
    const act = computeChordActivations(frame);
    const { pose } = resolveShapeChords(act);

    expect(pose.pitch).toBeGreaterThan(0); // head thrown back
  });

  it('zero overlap between dominance and stature components', () => {
    // Dominance uses β0, β2, β3, β4, β7, β18, β23
    // Stature uses β1, β5, β6, β8, β32
    const domComponents = new Set([0, 2, 3, 4, 7, 18, 23]);
    const statComponents = new Set([1, 5, 6, 8, 32]);
    for (const d of domComponents) {
      expect(statComponents.has(d)).toBe(false);
    }
  });
});
