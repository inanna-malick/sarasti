import { describe, it, expect } from 'vitest';
import { generateFaceSvg } from '../generator';
import type { FaceParams } from '../../../types';
import { zeroPose } from '../../../types';
import { N_SHAPE, N_EXPR } from '../../../constants';

describe('SVG Face Generator', () => {
  const createNeutralParams = (): FaceParams => ({
    shape: new Float32Array(N_SHAPE),
    expression: new Float32Array(N_EXPR),
    pose: zeroPose(),
    flush: 0,
    fatigue: 0,
  });

  it('generates a valid SVG string with neutral params', () => {
    const params = createNeutralParams();
    const svg = generateFaceSvg(params);
    expect(svg).toContain('<path');
    expect(svg).toContain('<ellipse');
    expect(svg).not.toContain('NaN');
  });

  it('produces different output for different shape params', () => {
    const params1 = createNeutralParams();
    const params2 = createNeutralParams();
    params2.shape[0] = 2.0; // Head width

    const svg1 = generateFaceSvg(params1);
    const svg2 = generateFaceSvg(params2);

    expect(svg1).not.toBe(svg2);
  });

  it('produces different output for different expression params', () => {
    const params1 = createNeutralParams();
    const params2 = createNeutralParams();
    params2.expression[3] = 1.0; // Mouth curve (smile)

    const svg1 = generateFaceSvg(params1);
    const svg2 = generateFaceSvg(params2);

    expect(svg1).not.toBe(svg2);
  });

  it('handles extreme values without crashing or producing NaN', () => {
    const params = createNeutralParams();
    // Set many params to extreme values
    for (let i = 0; i < 10; i++) {
      params.shape[i] = 5.0;
      params.expression[i] = -5.0;
    }

    const svg = generateFaceSvg(params);
    expect(svg).toBeDefined();
    expect(svg).not.toContain('NaN');
    expect(svg).toContain('<path');
  });

  it('maps shape[0] (head width) to face path coordinates', () => {
    const paramsMid = createNeutralParams();
    const paramsWide = createNeutralParams();
    paramsWide.shape[0] = 2.0;

    const svgMid = generateFaceSvg(paramsMid);
    const svgWide = generateFaceSvg(paramsWide);

    // Extract some coordinate that should change
    // The face path starts with M {centerX - headRx} {centerY}
    // headRx = 48 + s(0) * 4
    // for s(0)=0, headRx=48 -> centerX-48 = 60-48 = 12
    // for s(0)=2, headRx=48+8=56 -> centerX-56 = 60-56 = 4
    expect(svgMid).toContain('M 12 80');
    expect(svgWide).toContain('M 4 80');
  });

  it('maps expression[2] (mouth openness) to fill color', () => {
    const paramsClosed = createNeutralParams();
    const paramsOpen = createNeutralParams();
    paramsOpen.expression[2] = 1.0; // mouthOpen = 15

    const svgClosed = generateFaceSvg(paramsClosed);
    const svgOpen = generateFaceSvg(paramsOpen);

    expect(svgClosed).toContain('fill="none"'); // for mouth path
    expect(svgOpen).toContain('fill="#633"');
  });

  it('generates distinct SVG output for random params', () => {
    const outputs = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const params = createNeutralParams();
      for (let j = 0; j < 10; j++) {
        params.shape[j] = Math.random() * 4 - 2;
        params.expression[j] = Math.random() * 4 - 2;
      }
      outputs.add(generateFaceSvg(params));
    }
    expect(outputs.size).toBe(20);
  });
});
