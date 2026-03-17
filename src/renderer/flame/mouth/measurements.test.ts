import { describe, it, expect } from 'vitest';
import { identifyLipVertices, extractMouthMeasurements } from './measurements';
import { makeMockFlameModel } from '../../../../test-utils/flame-fixtures';

describe('identifyLipVertices', () => {
  it('finds vertices with jaw weight in [0.3, 0.7]', () => {
    const nVertices = 6;
    const nJoints = 5;
    const jawJoint = 2;
    const weights = new Float32Array(nVertices * nJoints);

    // v0: jaw weight 0.0 — not a lip vertex
    weights[0 * nJoints + jawJoint] = 0.0;
    // v1: jaw weight 0.3 — lip vertex (lower bound)
    weights[1 * nJoints + jawJoint] = 0.3;
    // v2: jaw weight 0.5 — lip vertex (mid)
    weights[2 * nJoints + jawJoint] = 0.5;
    // v3: jaw weight 0.7 — lip vertex (upper bound)
    weights[3 * nJoints + jawJoint] = 0.7;
    // v4: jaw weight 0.9 — jaw vertex, not lip
    weights[4 * nJoints + jawJoint] = 0.9;
    // v5: jaw weight 0.2 — head vertex, not lip
    weights[5 * nJoints + jawJoint] = 0.2;

    const result = identifyLipVertices(weights, nVertices, nJoints);
    expect(result).toEqual([1, 2, 3]);
  });
});

describe('extractMouthMeasurements', () => {
  it('produces non-degenerate measurements from mock model', () => {
    // Build a model with lip vertices in the jaw weight transition zone
    const model = makeMockFlameModel();

    // Override weights so some vertices have jaw weight in [0.3, 0.7]
    const nJoints = model.n_joints;
    // v0 has primary weight on joint 0 (root) — jaw weight 0.05
    // v1 has primary weight on joint 1 (neck) — jaw weight 0.05
    // v2 has primary weight on joint 2 (jaw) — jaw weight 0.8
    // v3 has primary weight on joint 3 (left eye) — jaw weight 0.05

    // Make v1 a lip vertex by setting its jaw weight to 0.5
    model.weights[1 * nJoints + 2] = 0.5;
    model.weights[1 * nJoints + 1] = 0.3; // reduce neck weight
    // Make v3 a lip vertex too
    model.weights[3 * nJoints + 2] = 0.4;
    model.weights[3 * nJoints + 3] = 0.4; // reduce left eye weight

    const measurements = extractMouthMeasurements(model);

    expect(measurements.lipVertices).toEqual([1, 3]);
    expect(measurements.lipWidth).toBeGreaterThan(0);
    expect(measurements.lipHeight).toBeGreaterThanOrEqual(0);
    expect(measurements.jawJointPosition).toBeDefined();
    expect(measurements.mouthCenter).toBeDefined();
  });

  it('returns empty lip vertices when no vertices have jaw weight in range', () => {
    const model = makeMockFlameModel();
    // Default mock weights have no vertices in [0.3, 0.7] for jaw

    const measurements = extractMouthMeasurements(model);
    expect(measurements.lipVertices).toEqual([]);
    // With no lip vertices, extents are degenerate
    expect(measurements.lipWidth).toBe(-Infinity);
  });
});
