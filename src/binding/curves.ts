import type { ResponseCurve, CurveType } from './types';

/**
 * Apply a response curve to an input value.
 * Clamps input to [input_min, input_max], maps to [output_min, output_max].
 */
export function applyCurve(curve: ResponseCurve, input: number): number {
  // Clamp input
  const clamped = Math.max(curve.input_min, Math.min(curve.input_max, input));

  // Normalize to [0, 1]
  const range = curve.input_max - curve.input_min;
  if (range === 0) return curve.output_min;
  const t = (clamped - curve.input_min) / range;

  // Apply curve shape
  const shaped = applyShape(curve.type, t, curve.steepness);

  // Map to output range
  return curve.output_min + shaped * (curve.output_max - curve.output_min);
}

function applyShape(type: CurveType, t: number, steepness: number): number {
  switch (type) {
    case 'linear':
      return t;
    case 'exponential':
      // Exponential ramp: slow start, fast finish
      // steepness controls how pronounced the curve is
      return (Math.exp(steepness * t) - 1) / (Math.exp(steepness) - 1);
    case 'sigmoid':
      // Sigmoid: slow start, fast middle, slow finish
      // Centered at t=0.5, steepness controls slope
      return 1 / (1 + Math.exp(-steepness * (t - 0.5)));
  }
}

/**
 * Apply a curve symmetrically around zero.
 * Input in [-max, +max] → output in [-output_max, +output_max].
 * The curve shape applies to the absolute value; sign is preserved.
 */
export function applySymmetricCurve(curve: ResponseCurve, input: number): number {
  const sign = Math.sign(input);
  const magnitude = Math.abs(input);

  // Use the positive half of the curve
  const positiveCurve: ResponseCurve = {
    ...curve,
    input_min: 0,
    input_max: Math.max(Math.abs(curve.input_min), Math.abs(curve.input_max)),
    output_min: 0,
    output_max: Math.max(Math.abs(curve.output_min), Math.abs(curve.output_max)),
  };

  return sign * applyCurve(positiveCurve, magnitude);
}
