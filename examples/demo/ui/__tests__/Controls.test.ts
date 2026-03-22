import { describe, it, expect } from 'vitest';
import { Controls } from '../Controls';

describe('Controls', () => {
  it('exports a Controls component', () => {
    expect(typeof Controls).toBe('function');
  });
});
