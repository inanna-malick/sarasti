/**
 * Contract tests for deform().
 *
 * These tests define the deformation contract that the deformer Dev implements against.
 * Using mock fixtures (tiny tetrahedron with analytically predictable basis).
 */

import { describe, it, expect } from 'vitest';
import { deform } from './deform';
import { makeMockFlameModel, MOCK_N_VERTICES } from '../../../test-utils/flame-fixtures';
import { N_SHAPE, N_EXPR } from '../../constants';

describe('deform', () => {
  const model = makeMockFlameModel();

  it('zero params → returns template vertices unchanged', () => {
    const beta = new Float32Array(N_SHAPE);  // all zeros
    const psi = new Float32Array(N_EXPR);    // all zeros
    const result = deform(model, beta, psi);

    expect(result.vertices.length).toBe(MOCK_N_VERTICES * 3);
    // Should match template exactly
    for (let i = 0; i < model.template.length; i++) {
      expect(result.vertices[i]).toBeCloseTo(model.template[i], 5);
    }
  });

  it('returns normals array of correct length', () => {
    const beta = new Float32Array(N_SHAPE);
    const psi = new Float32Array(N_EXPR);
    const result = deform(model, beta, psi);

    expect(result.normals.length).toBe(MOCK_N_VERTICES * 3);
  });

  it('linearity: deform(2β) = template + 2×(deform(β) - template)', () => {
    const beta1 = new Float32Array(N_SHAPE);
    beta1[0] = 0.5;
    beta1[3] = -0.3;

    const beta2 = new Float32Array(N_SHAPE);
    beta2[0] = 1.0;
    beta2[3] = -0.6;

    const psi = new Float32Array(N_EXPR);

    const r1 = deform(model, beta1, psi);
    const r2 = deform(model, beta2, psi);

    for (let i = 0; i < MOCK_N_VERTICES * 3; i++) {
      const delta1 = r1.vertices[i] - model.template[i];
      const delta2 = r2.vertices[i] - model.template[i];
      expect(delta2).toBeCloseTo(2 * delta1, 4);
    }
  });

  it('shape and expression are independent (additive)', () => {
    const beta = new Float32Array(N_SHAPE);
    beta[0] = 1.0;

    const psi = new Float32Array(N_EXPR);
    psi[0] = 1.0;

    const zeroBeta = new Float32Array(N_SHAPE);
    const zeroPsi = new Float32Array(N_EXPR);

    const shapeOnly = deform(model, beta, zeroPsi);
    const exprOnly = deform(model, zeroBeta, psi);
    const both = deform(model, beta, psi);

    for (let i = 0; i < MOCK_N_VERTICES * 3; i++) {
      const shapeDelta = shapeOnly.vertices[i] - model.template[i];
      const exprDelta = exprOnly.vertices[i] - model.template[i];
      const bothDelta = both.vertices[i] - model.template[i];
      expect(bothDelta).toBeCloseTo(shapeDelta + exprDelta, 4);
    }
  });

  it('unit shape vector produces expected displacement', () => {
    // Component 0 should move vertex 0 along axis 0 (x) by 1.0
    const beta = new Float32Array(N_SHAPE);
    beta[0] = 1.0;
    const psi = new Float32Array(N_EXPR);

    const result = deform(model, beta, psi);

    // Vertex 0, x-axis should be shifted by 1.0 from template
    expect(result.vertices[0]).toBeCloseTo(model.template[0] + 1.0, 5);
    // Vertex 0, y and z should be unchanged
    expect(result.vertices[1]).toBeCloseTo(model.template[1], 5);
    expect(result.vertices[2]).toBeCloseTo(model.template[2], 5);
  });

  it('unit expression vector produces expected displacement', () => {
    // Component 0: vertex=(0+1)%4=1, axis=(0+1)%3=1 → vertex 1, y-axis
    const beta = new Float32Array(N_SHAPE);
    const psi = new Float32Array(N_EXPR);
    psi[0] = 1.0;

    const result = deform(model, beta, psi);

    // Vertex 1, y-axis should be shifted by 1.0
    const v1y = 1 * 3 + 1; // vertex 1, y
    expect(result.vertices[v1y]).toBeCloseTo(model.template[v1y] + 1.0, 5);
  });

  it('normals are unit length', () => {
    const beta = new Float32Array(N_SHAPE);
    beta[0] = 0.5;
    const psi = new Float32Array(N_EXPR);
    psi[0] = 0.3;

    const result = deform(model, beta, psi);

    for (let v = 0; v < MOCK_N_VERTICES; v++) {
      const nx = result.normals[v * 3];
      const ny = result.normals[v * 3 + 1];
      const nz = result.normals[v * 3 + 2];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      expect(len).toBeCloseTo(1.0, 3);
    }
  });
});
