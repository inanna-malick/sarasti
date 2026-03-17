import { describe, it, expect } from 'vitest';
import { mapAgeToShape, DEFAULT_AGE_MAPPING, validateAgeMapping, getAgeDescription } from '../age';
import type { AgeMapping } from '../types';

describe('mapAgeToShape', () => {
  it('age 20 → young values', () => {
    const result = mapAgeToShape(20);
    for (let i = 0; i < result.entries.length; i++) {
      expect(result.entries[i][1]).toBeCloseTo(DEFAULT_AGE_MAPPING.young_values[i]);
    }
  });

  it('age 60 → old values', () => {
    const result = mapAgeToShape(60);
    for (let i = 0; i < result.entries.length; i++) {
      expect(result.entries[i][1]).toBeCloseTo(DEFAULT_AGE_MAPPING.old_values[i]);
    }
  });

  it('age 40 → midpoint between young and old', () => {
    const result = mapAgeToShape(40);
    for (let i = 0; i < result.entries.length; i++) {
      const expected = (DEFAULT_AGE_MAPPING.young_values[i] + DEFAULT_AGE_MAPPING.old_values[i]) / 2;
      expect(result.entries[i][1]).toBeCloseTo(expected);
    }
  });

  it('monotonic: higher age → higher values on first component', () => {
    const ages = [20, 30, 40, 50, 60];
    const values = ages.map(a => mapAgeToShape(a).entries[0][1]);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it('clamps below age 20', () => {
    const result = mapAgeToShape(10);
    const at20 = mapAgeToShape(20);
    for (let i = 0; i < result.entries.length; i++) {
      expect(result.entries[i][1]).toBeCloseTo(at20.entries[i][1]);
    }
  });

  it('clamps above age 60', () => {
    const result = mapAgeToShape(80);
    const at60 = mapAgeToShape(60);
    for (let i = 0; i < result.entries.length; i++) {
      expect(result.entries[i][1]).toBeCloseTo(at60.entries[i][1]);
    }
  });

  it('uses correct indices from mapping', () => {
    const result = mapAgeToShape(40);
    for (let i = 0; i < result.entries.length; i++) {
      expect(result.entries[i][0]).toBe(DEFAULT_AGE_MAPPING.indices[i]);
    }
  });

  it('age 20 ≠ age 60 — L2 distance > threshold', () => {
    const young = mapAgeToShape(20);
    const old = mapAgeToShape(60);
    let dist = 0;
    for (let i = 0; i < young.entries.length; i++) {
      dist += (young.entries[i][1] - old.entries[i][1]) ** 2;
    }
    dist = Math.sqrt(dist);
    expect(dist).toBeGreaterThan(1.0);
  });

  it('accepts custom mapping', () => {
    const custom: AgeMapping = {
      indices: [10, 11],
      young_values: [0, 0],
      old_values: [5, 5],
    };
    const result = mapAgeToShape(40, custom);
    expect(result.entries.length).toBe(2);
    expect(result.entries[0][0]).toBe(10);
    expect(result.entries[0][1]).toBeCloseTo(2.5);
  });

  it('handles potential edge case values for age without NaN or Infinity', () => {
    const results = [
      mapAgeToShape(-Infinity),
      mapAgeToShape(NaN),
      mapAgeToShape(Infinity),
      mapAgeToShape(20),
      mapAgeToShape(60),
    ];
    for (const res of results) {
      for (const [, val] of res.entries) {
        expect(Number.isFinite(val)).toBe(true);
      }
    }
  });
});

describe('validateAgeMapping', () => {
  it('passes for default mapping', () => {
    expect(validateAgeMapping(DEFAULT_AGE_MAPPING)).toBe(true);
  });

  it('allows overlap with class indices (age + class stack additively)', () => {
    const valid: AgeMapping = {
      indices: [0, 1, 3], // 0 and 3 are class indices — allowed
      young_values: [0, 0, 0],
      old_values: [1, 1, 1],
    };
    expect(validateAgeMapping(valid)).toBe(true);
  });

  it('fails if index overlaps with family indices (e.g., 5)', () => {
    const invalid: AgeMapping = {
      indices: [0, 1, 5], // 5 is a family index
      young_values: [0, 0, 0],
      old_values: [1, 1, 1],
    };
    expect(validateAgeMapping(invalid)).toBe(false);
  });
});

describe('getAgeDescription', () => {
  it('returns young (20)', () => {
    expect(getAgeDescription(20)).toBe('young (20)');
  });

  it('returns elder (60)', () => {
    expect(getAgeDescription(60)).toBe('elder (60)');
  });

  it('returns middle-aged (40)', () => {
    expect(getAgeDescription(40)).toBe('middle-aged (40)');
  });

  it('returns middle-aged (30)', () => {
    expect(getAgeDescription(30)).toBe('middle-aged (30)');
  });

  it('returns adult (50)', () => {
    expect(getAgeDescription(50)).toBe('adult (50)');
  });
});
