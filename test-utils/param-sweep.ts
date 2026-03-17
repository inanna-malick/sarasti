import { N_SHAPE, N_EXPR } from '../src/constants';
import type { FaceParams, FaceInstance, TickerConfig, TickerFrame } from '../src/types';

/**
 * Generate FaceParams with a single component swept across a range.
 * All other components are zero.
 */
export function sweepSingleComponent(
  target: 'shape' | 'expression',
  componentIndex: number,
  steps: number,
  range: [number, number] = [-2, 2],
): FaceParams[] {
  const [lo, hi] = range;
  return Array.from({ length: steps }, (_, i) => {
    const t = steps === 1 ? 0.5 : i / (steps - 1);
    const value = lo + t * (hi - lo);
    const shape = new Float32Array(N_SHAPE);
    const expression = new Float32Array(N_EXPR);

    if (target === 'shape') {
      shape[componentIndex] = value;
    } else {
      expression[componentIndex] = value;
    }

    return { shape, expression };
  });
}

/**
 * Generate a grid of FaceInstances for visual gallery testing.
 * Positions faces in a grid layout with given spacing.
 */
export function makeGalleryInstances(
  paramsList: FaceParams[],
  cols: number = 5,
  spacing: number = 2.5,
): FaceInstance[] {
  const dummyTicker: TickerConfig = {
    id: 'TEST', name: 'Test', class: 'energy', family: 'test', age: 30,
  };
  const dummyFrame: TickerFrame = {
    close: 100, volume: 1000, deviation: 0, velocity: 0, volatility: 1,
  };

  return paramsList.map((params, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      id: `test-${i}`,
      params,
      position: [
        (col - (cols - 1) / 2) * spacing,
        -(row * spacing),
        0,
      ] as [number, number, number],
      ticker: dummyTicker,
      frame: dummyFrame,
    };
  });
}

/**
 * Generate 9 distinct face params for a standard "gallery 9" visual check.
 * Varies first 3 shape + first 3 expression components.
 */
export function makeGallery9(): FaceParams[] {
  return Array.from({ length: 9 }, (_, i) => {
    const shape = new Float32Array(N_SHAPE);
    const expression = new Float32Array(N_EXPR);

    // Vary shape components 0-2 in a 3x3 pattern
    const row = Math.floor(i / 3);
    const col = i % 3;
    shape[0] = (col - 1) * 1.5;
    shape[1] = (row - 1) * 1.5;
    shape[2] = ((col + row) % 3 - 1) * 0.8;

    // Vary expression components 0-2
    expression[0] = (col - 1) * 1.0;
    expression[1] = (row - 1) * 1.0;
    expression[2] = (i / 8 - 0.5) * 1.5;

    return { shape, expression };
  });
}
