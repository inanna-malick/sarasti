import { describe, it, expect } from 'vitest';
import { identifyLipVertices, classifyLipVertices, computeVertexCentroid, extractMouthMeasurements } from './measurements';
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

describe('classifyLipVertices', () => {
  it('splits lip vertices at threshold 0.5', () => {
    const nJoints = 5;
    const jawJoint = 2;
    const weights = new Float32Array(6 * nJoints);

    // v1: jaw weight 0.3 → upper (< 0.5)
    weights[1 * nJoints + jawJoint] = 0.3;
    // v2: jaw weight 0.5 → lower (>= 0.5)
    weights[2 * nJoints + jawJoint] = 0.5;
    // v3: jaw weight 0.7 → lower (>= 0.5)
    weights[3 * nJoints + jawJoint] = 0.7;

    const result = classifyLipVertices([1, 2, 3], weights, nJoints);
    expect(result.upper).toEqual([1]);
    expect(result.lower).toEqual([2, 3]);
  });

  it('returns empty arrays when no lip vertices', () => {
    const weights = new Float32Array(5);
    const result = classifyLipVertices([], weights, 5);
    expect(result.upper).toEqual([]);
    expect(result.lower).toEqual([]);
  });

  it('all upper when all below threshold', () => {
    const nJoints = 5;
    const jawJoint = 2;
    const weights = new Float32Array(4 * nJoints);
    weights[1 * nJoints + jawJoint] = 0.35;
    weights[2 * nJoints + jawJoint] = 0.45;

    const result = classifyLipVertices([1, 2], weights, nJoints);
    expect(result.upper).toEqual([1, 2]);
    expect(result.lower).toEqual([]);
  });
});

describe('computeVertexCentroid', () => {
  it('computes centroid of vertex subset', () => {
    // 4 vertices: v0=(1,2,3), v1=(5,6,7), v2=(9,10,11), v3=(0,0,0)
    const verts = new Float32Array([1,2,3, 5,6,7, 9,10,11, 0,0,0]);
    const center = computeVertexCentroid(verts, [0, 2]);
    expect(center.x).toBeCloseTo(5, 5);   // (1+9)/2
    expect(center.y).toBeCloseTo(6, 5);   // (2+10)/2
    expect(center.z).toBeCloseTo(7, 5);   // (3+11)/2
  });

  it('returns zero vector for empty indices', () => {
    const verts = new Float32Array([1,2,3]);
    const center = computeVertexCentroid(verts, []);
    expect(center.x).toBe(0);
    expect(center.y).toBe(0);
    expect(center.z).toBe(0);
  });
});

describe('extractMouthMeasurements', () => {
  it('produces non-degenerate measurements from mock model', () => {
    // Build a model with lip vertices in the jaw weight transition zone
    const model = makeMockFlameModel();

    // Override weights so some vertices have jaw weight in [0.3, 0.7]
    const nJoints = model.n_joints;
    // Make v1 a lip vertex by setting its jaw weight to 0.5
    model.weights[1 * nJoints + 2] = 0.5;
    model.weights[1 * nJoints + 1] = 0.3; // reduce neck weight
    // Make v3 a lip vertex too
    model.weights[3 * nJoints + 2] = 0.4;
    model.weights[3 * nJoints + 3] = 0.4; // reduce left eye weight

    const measurements = extractMouthMeasurements(model);

    expect(measurements).not.toBeNull();
    expect(measurements!.lipVertices).toEqual([1, 3]);
    expect(measurements!.lipWidth).toBeGreaterThan(0);
    expect(measurements!.lipHeight).toBeGreaterThanOrEqual(0);
    expect(measurements!.jawJointPosition).toBeDefined();
    expect(measurements!.mouthCenter).toBeDefined();
  });

  it('classifies lip vertices into upper and lower', () => {
    const model = makeMockFlameModel();
    const nJoints = model.n_joints;

    // v1: jaw weight 0.4 → upper (< 0.5)
    model.weights[1 * nJoints + 2] = 0.4;
    model.weights[1 * nJoints + 1] = 0.4;
    // v3: jaw weight 0.6 → lower (>= 0.5)
    model.weights[3 * nJoints + 2] = 0.6;
    model.weights[3 * nJoints + 3] = 0.2;

    const measurements = extractMouthMeasurements(model);
    expect(measurements).not.toBeNull();
    expect(measurements!.upperLipVertices).toEqual([1]);
    expect(measurements!.lowerLipVertices).toEqual([3]);
    expect(measurements!.upperLipCenter).toBeDefined();
    expect(measurements!.lowerLipCenter).toBeDefined();
  });

  it('returns null when no vertices have jaw weight in range', () => {
    const model = makeMockFlameModel();
    // Default mock weights have no vertices in [0.3, 0.7] for jaw

    const measurements = extractMouthMeasurements(model);
    expect(measurements).toBeNull();
  });
});
