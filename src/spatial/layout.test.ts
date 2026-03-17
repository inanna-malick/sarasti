import { describe, it, expect } from 'vitest';
import { TICKERS } from '../tickers';
import { computeLayout } from './layout';
import { LayoutStrategy } from '../types';

describe('computeLayout', () => {
  const FACE_RADIUS = 1.0;

  const getDistance = (p1: [number, number, number], p2: [number, number, number]) => {
    return Math.sqrt(
      Math.pow(p1[0] - p2[0], 2) +
      Math.pow(p1[1] - p2[1], 2) +
      Math.pow(p1[2] - p2[2], 2)
    );
  };

  const strategies: LayoutStrategy[] = [
    { kind: 'family-rows' },
    { kind: 'class-clusters' },
    { kind: 'reactivity-sweep' }
  ];

  strategies.forEach((strategy) => {
    describe(strategy.kind, () => {
      it(`assigns positions to all ${TICKERS.length} tickers`, () => {
        const result = computeLayout(TICKERS, strategy);
        expect(result.positions.size).toBe(TICKERS.length);
        TICKERS.forEach(t => {
          expect(result.positions.has(t.id)).toBe(true);
        });
      });

      it('has no position overlaps (min distance > 1.0)', () => {
        const result = computeLayout(TICKERS, strategy);
        const posArray = Array.from(result.positions.values());
        
        for (let i = 0; i < posArray.length; i++) {
          for (let j = i + 1; j < posArray.length; j++) {
            const dist = getDistance(posArray[i], posArray[j]);
            expect(dist).toBeGreaterThan(1.0);
          }
        }
      });
    });
  });

  describe('family-rows specific properties', () => {
    it('members of the same family have the same Y coordinate', () => {
      const result = computeLayout(TICKERS, { kind: 'family-rows' });
      const families = new Set(TICKERS.map(t => t.family));
      
      families.forEach(familyId => {
        const familyTickers = TICKERS.filter(t => t.family === familyId);
        const yCoords = familyTickers.map(t => result.positions.get(t.id)![1]);
        const firstY = yCoords[0];
        yCoords.forEach(y => expect(y).toBeCloseTo(firstY));
      });
    });

    it('within a family, positions are sorted by age on X axis', () => {
      const result = computeLayout(TICKERS, { kind: 'family-rows' });
      const families = new Set(TICKERS.map(t => t.family));
      
      families.forEach(familyId => {
        const familyTickers = TICKERS.filter(t => t.family === familyId).sort((a, b) => a.age - b.age);
        for (let i = 0; i < familyTickers.length - 1; i++) {
          const x1 = result.positions.get(familyTickers[i].id)![0];
          const x2 = result.positions.get(familyTickers[i+1].id)![0];
          expect(x1).toBeLessThan(x2);
        }
      });
    });
  });

  describe('class-clusters specific properties', () => {
    it('intra-class distances < inter-class distances', () => {
      const result = computeLayout(TICKERS, { kind: 'class-clusters' });
      
      const assetClasses = ['energy', 'fear', 'currency', 'equity', 'media'];
      
      assetClasses.forEach(ac => {
        const classTickers = TICKERS.filter(t => t.class === ac);
        const otherTickers = TICKERS.filter(t => t.class !== ac);
        
        // Calculate max intra-class distance
        let maxIntra = 0;
        for (let i = 0; i < classTickers.length; i++) {
          for (let j = i + 1; j < classTickers.length; j++) {
            const d = getDistance(result.positions.get(classTickers[i].id)!, result.positions.get(classTickers[j].id)!);
            if (d > maxIntra) maxIntra = d;
          }
        }
        
        // Calculate min inter-class distance
        let minInter = Infinity;
        for (const ct of classTickers) {
          for (const ot of otherTickers) {
            const d = getDistance(result.positions.get(ct.id)!, result.positions.get(ot.id)!);
            if (d < minInter) minInter = d;
          }
        }
        
        expect(maxIntra).toBeLessThan(minInter);
      });
    });
  });

  describe('reactivity-sweep specific properties', () => {
    it('is sorted by age on X axis', () => {
      const result = computeLayout(TICKERS, { kind: 'reactivity-sweep' });
      const sortedByAge = [...TICKERS].sort((a, b) => a.age - b.age);
      
      for (let i = 0; i < sortedByAge.length - 1; i++) {
        const x1 = result.positions.get(sortedByAge[i].id)![0];
        const x2 = result.positions.get(sortedByAge[i+1].id)![0];
        expect(x1).toBeLessThan(x2);
      }
    });

    it('has all Y and Z as zero', () => {
      const result = computeLayout(TICKERS, { kind: 'reactivity-sweep' });
      TICKERS.forEach(t => {
        const pos = result.positions.get(t.id)!;
        expect(pos[1]).toBe(0);
        expect(pos[2]).toBe(0);
      });
    });
  });
});
