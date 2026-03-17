import { describe, it, expect } from 'vitest';
import { LAYOUTS } from '../Controls';

describe('Controls constants', () => {
  it('contains correct layout strategies', () => {
    expect(LAYOUTS).toHaveLength(3);
    expect(LAYOUTS.map(l => l.strategy.kind)).toContain('family-rows');
    expect(LAYOUTS.map(l => l.strategy.kind)).toContain('class-clusters');
    expect(LAYOUTS.map(l => l.strategy.kind)).toContain('reactivity-sweep');
  });
});
