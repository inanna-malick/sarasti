import { describe, it, expect } from 'vitest';
import { identifyEyeVertices } from './eyes';

describe('identifyEyeVertices', () => {
  it('identifies eye vertices and faces correctly', () => {
    const nVertices = 5;
    const nJoints = 5;
    const weights = new Float32Array(nVertices * nJoints);
    // Vertex 0: left eye (joint 3)
    weights[0 * nJoints + 3] = 0.6;
    // Vertex 1: left eye (joint 3)
    weights[1 * nJoints + 3] = 0.6;
    // Vertex 2: left eye (joint 3)
    weights[2 * nJoints + 3] = 0.6;
    // Vertex 3: right eye (joint 4)
    weights[3 * nJoints + 4] = 0.6;
    // Vertex 4: skin
    weights[4 * nJoints + 0] = 1.0;

    const faces = new Uint32Array([
      0, 1, 2, // left eye face
      0, 1, 3, // mixed face
      3, 4, 0, // mixed face
    ]);

    const result = identifyEyeVertices(weights, faces, nVertices, nJoints);

    expect(result.leftEyeVertices).toEqual([0, 1, 2]);
    expect(result.rightEyeVertices).toEqual([3]);
    expect(result.leftEyeFaces).toEqual([0]);
    expect(result.rightEyeFaces).toEqual([]);
  });
});
