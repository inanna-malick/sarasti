import { describe, it, expect } from 'vitest';
import { createShapeResolver } from '../../resolve';
import { N_SHAPE } from '../../../constants';
import { makeTickerFrame } from '../../../../test-utils/fixtures';

describe('ShapeResolver (data-driven)', () => {
  const resolver = createShapeResolver();

  it('resolves neutral frame to valid shape vector', () => {
    const shape = resolver.resolve(makeTickerFrame());
    expect(shape.length).toBe(N_SHAPE);
    for (let i = 0; i < N_SHAPE; i++) {
      expect(Number.isFinite(shape[i])).toBe(true);
    }
  });

  it('deterministic: same frame → same shape', () => {
    const frame = makeTickerFrame({ momentum: 1.5, mean_reversion_z: 2.0, beta: 0.5 });
    const a = resolver.resolve(frame);
    const b = resolver.resolve(frame);
    for (let i = 0; i < N_SHAPE; i++) {
      expect(a[i]).toBe(b[i]);
    }
  });

  it('momentum drives stature axis (β0, β3, β2)', () => {
    const rising = resolver.resolve(makeTickerFrame({ momentum: 2.0 }));
    const falling = resolver.resolve(makeTickerFrame({ momentum: -2.0 }));
    const neutral = resolver.resolve(makeTickerFrame({ momentum: 0 }));

    // β0 (global width) should be positive for rising momentum, negative for falling
    expect(rising[0]).toBeGreaterThan(neutral[0]);
    expect(falling[0]).toBeLessThan(neutral[0]);
  });

  it('mean_reversion_z drives proportion axis (β1, β4, β6)', () => {
    const stretched = resolver.resolve(makeTickerFrame({ mean_reversion_z: 3.0 }));
    const normal = resolver.resolve(makeTickerFrame({ mean_reversion_z: 0 }));

    // β1 (face length) should increase with overextension
    expect(stretched[1]).toBeGreaterThan(normal[1]);
  });

  it('beta deviation from 1 drives angularity axis (β10, β8, β5)', () => {
    const rebel = resolver.resolve(makeTickerFrame({ beta: 2.5 })); // far from herd
    const conformist = resolver.resolve(makeTickerFrame({ beta: 1.0 })); // with herd

    // β10 (chin projection) should be higher for rebel
    expect(rebel[10]).toBeGreaterThan(conformist[10]);
  });

  it('shape values stay within reasonable bounds (±10)', () => {
    const frames = [
      makeTickerFrame({ momentum: 3, mean_reversion_z: 4, beta: 3 }),
      makeTickerFrame({ momentum: -3, mean_reversion_z: -4, beta: -1 }),
    ];
    for (const frame of frames) {
      const shape = resolver.resolve(frame);
      for (let i = 0; i < N_SHAPE; i++) {
        expect(Math.abs(shape[i])).toBeLessThan(10);
      }
    }
  });
});
