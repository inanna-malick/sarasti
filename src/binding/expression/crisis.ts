import type { CrisisExpressionResult } from './types';
import type { BindingConfig, ExpressionRegister } from '../types';
import { DEFAULT_BINDING_CONFIG } from '../config';
import { applySymmetricCurve } from '../curves';
import { N_EXPR } from '../../constants';

/**
 * Maps deviation → base expression.
 *
 * Deviation < 0 → distress register (market falling)
 * Deviation > 0 → shock register (market spiking)
 * Near zero → neutral (all components near zero)
 *
 * The intensity follows the configured response curve (default: sigmoid).
 */
export function mapCrisisToExpression(
  deviation: number,
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
): CrisisExpressionResult {
  const expression = new Float32Array(N_EXPR);

  // Apply deviation curve to get intensity
  const mapped = applySymmetricCurve(config.deviation_curve, deviation);
  const intensity = Math.abs(mapped);

  if (intensity < 0.01) {
    return { register: 'neutral', intensity: 0, expression };
  }

  // Select register based on sign
  let register: CrisisExpressionResult['register'];
  let regConfig: ExpressionRegister;

  if (mapped < 0) {
    register = 'distress';
    regConfig = config.expression.distress;
  } else {
    register = 'shock';
    regConfig = config.expression.shock;
  }

  // Apply register weights scaled by intensity
  const scaledIntensity = intensity * config.expression_intensity;
  for (let i = 0; i < regConfig.indices.length; i++) {
    const idx = regConfig.indices[i];
    if (idx < N_EXPR) {
      expression[idx] = regConfig.weights[i] * scaledIntensity;
    }
  }

  return { register, intensity, expression };
}
