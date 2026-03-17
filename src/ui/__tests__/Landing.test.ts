import { describe, it, expect } from 'vitest';
import { LANDING_CONTENT } from '../Landing';

describe('Landing content', () => {
  it('has the correct title and text', () => {
    expect(LANDING_CONTENT.title).toBe('THE TIDAL SCREAM');
    expect(LANDING_CONTENT.subtitle).toContain('Twenty-five financial instruments');
    expect(LANDING_CONTENT.prompt).toBe('click anywhere to begin');
    expect(LANDING_CONTENT.quote).toContain('What do they represent?');
  });
});
