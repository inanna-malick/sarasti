import { describe, it, expect } from 'vitest';
import { mapIdentityToShape, getClassDescription } from '../identity';
import type { AssetClass } from '../../../types';
import { TICKERS } from '../../../tickers';
import { N_SHAPE } from '../../../constants';
import { DEFAULT_BINDING_CONFIG } from '../../config';

describe('mapIdentityToShape', () => {
  it('returns class entries for each asset class', () => {
    const classes: AssetClass[] = ['energy', 'fear', 'currency', 'equity', 'media'];
    for (const cls of classes) {
      const result = mapIdentityToShape(cls, 'test');
      expect(result.class_entries.length).toBeGreaterThan(0);
      // All indices should be valid
      for (const [idx] of result.class_entries) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(N_SHAPE);
      }
    }
  });

  it('getClassDescription returns expected strings', () => {
    expect(getClassDescription('energy')).toBe('wider face, heavier jaw');
    expect(getClassDescription('fear')).toBe('narrow, sharp features');
    expect(getClassDescription('currency')).toBe('neutral baseline');
    expect(getClassDescription('equity')).toBe('rounder, softer features');
    expect(getClassDescription('media')).toBe('angular, high-contrast features');
  });

  it('class profiles are meaningfully different (L2 > 0.5)', () => {
    const classes: AssetClass[] = ['energy', 'fear', 'currency', 'equity', 'media'];
    
    function l2_class(a: [number, number][], b: [number, number][]): number {
      const mapA = new Map(a);
      const mapB = new Map(b);
      const allIndices = new Set([...mapA.keys(), ...mapB.keys()]);
      let sum = 0;
      for (const idx of allIndices) {
        sum += ((mapA.get(idx) ?? 0) - (mapB.get(idx) ?? 0)) ** 2;
      }
      return Math.sqrt(sum);
    }

    for (let i = 0; i < classes.length; i++) {
      for (let j = i + 1; j < classes.length; j++) {
        const profileI = DEFAULT_BINDING_CONFIG.class_profiles[classes[i]];
        const profileJ = DEFAULT_BINDING_CONFIG.class_profiles[classes[j]];
        const dist = l2_class(profileI, profileJ);
        expect(dist, `Distance between ${classes[i]} and ${classes[j]} is ${dist}`).toBeGreaterThan(0.5);
      }
    }
  });

  it('returns family entries for known families', () => {
    const knownFamilies = ['brent', 'wti', 'natgas', 'distill', 'consumer',
                           'vol', 'haven', 'currency', 'rates', 'sector', 'broad', 'gdelt'];
    for (const family of knownFamilies) {
      const result = mapIdentityToShape('energy', family);
      expect(result.family_entries.length).toBeGreaterThan(0);
    }
  });

  it('unknown family → empty family entries', () => {
    const result = mapIdentityToShape('energy', 'unknown_family');
    expect(result.family_entries.length).toBe(0);
  });

  it('different classes produce different profiles', () => {
    const energy = mapIdentityToShape('energy', 'brent');
    const fear = mapIdentityToShape('fear', 'vol');
    // At least one class entry should differ
    const energyMap = new Map(energy.class_entries);
    const fearMap = new Map(fear.class_entries);
    let differs = false;
    for (const [idx, val] of energyMap) {
      if (fearMap.get(idx) !== val) differs = true;
    }
    expect(differs).toBe(true);
  });

  it('same class, different family → same class entries, different family entries', () => {
    const brent = mapIdentityToShape('energy', 'brent');
    const wti = mapIdentityToShape('energy', 'wti');
    // Class entries should be identical
    expect(brent.class_entries).toEqual(wti.class_entries);
    // Family entries should differ
    expect(brent.family_entries).not.toEqual(wti.family_entries);
  });

  it('intra-class distance < inter-class distance (all 25 tickers)', () => {
    // Build full shape vectors for all tickers
    function fullShape(ticker: typeof TICKERS[0]): Float32Array {
      const shape = new Float32Array(N_SHAPE);
      const result = mapIdentityToShape(ticker.class, ticker.family);
      for (const [idx, val] of result.class_entries) {
        if (idx < N_SHAPE) shape[idx] = val;
      }
      for (const [idx, val] of result.family_entries) {
        if (idx < N_SHAPE) shape[idx] += val;
      }
      return shape;
    }

    function l2(a: Float32Array, b: Float32Array): number {
      let sum = 0;
      for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
      return Math.sqrt(sum);
    }

    const shapes = TICKERS.map(t => ({ ticker: t, shape: fullShape(t) }));

    // Compute average intra-class and inter-class distances
    let intraSum = 0, intraCount = 0;
    let interSum = 0, interCount = 0;
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const dist = l2(shapes[i].shape, shapes[j].shape);
        if (shapes[i].ticker.class === shapes[j].ticker.class) {
          intraSum += dist;
          intraCount++;
        } else {
          interSum += dist;
          interCount++;
        }
      }
    }

    const avgIntra = intraSum / intraCount;
    const avgInter = interSum / interCount;
    expect(avgIntra).toBeLessThan(avgInter);
  });
});
