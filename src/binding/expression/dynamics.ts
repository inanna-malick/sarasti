import type { DynamicsResult } from './types';
import type { BindingConfig, ExpressionRegister } from '../types';
import { DEFAULT_BINDING_CONFIG } from '../config';
import { applyCurve, applySymmetricCurve } from '../curves';
import { N_EXPR } from '../../constants';

/**
 * Modulates a base expression with velocity and volatility.
 *
 * Velocity → expression type modifier:
 *   sharp negative velocity → amplify shock components (sudden drop)
 *   sustained negative → amplify dread components (grinding down)
 *   positive velocity → shift toward relief
 *
 * Volatility → expression complexity:
 *   high vol → multiple expression components active (conflicted face)
 *   low vol → clean single-register expression (frozen scream or frozen calm)
 */
export function mapDynamicsToExpression(
  baseExpression: Float32Array,
  velocity: number,
  volatility: number,
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
): DynamicsResult {
  const expression = new Float32Array(baseExpression);

  // Map velocity through curve
  const velMapped = applySymmetricCurve(config.velocity_curve, velocity);

  // Map volatility through curve → complexity
  const complexity = applyCurve(config.volatility_curve, volatility);

  // Velocity modulation: blend in secondary registers
  if (velMapped < -0.3) {
    // Sharp negative velocity → add shock components (sudden drop = shock)
    blendRegister(expression, config.expression.shock, Math.abs(velMapped) * 0.5);
  } else if (velMapped < -0.05) {
    // Sustained negative → add dread components
    blendRegister(expression, config.expression.dread, Math.abs(velMapped) * 0.6);
  } else if (velMapped > 0.1) {
    // Positive velocity → blend in relief
    blendRegister(expression, config.expression.relief, velMapped * 0.4);
  }

  // Volatility modulation: high complexity → activate more components
  // Low complexity → suppress secondary components (keep only strongest register)
  if (complexity < 0.3) {
    // Low vol: suppress weaker components, amplify strongest
    suppressWeakComponents(expression, 0.3);
  }
  // High complexity naturally results from multiple register blending above

  return { expression, complexity };
}

/**
 * Additively blend a register into an expression vector.
 */
function blendRegister(
  expression: Float32Array,
  register: ExpressionRegister,
  strength: number,
): void {
  for (let i = 0; i < register.indices.length; i++) {
    const idx = register.indices[i];
    if (idx < expression.length) {
      expression[idx] += register.weights[i] * strength;
    }
  }
}

/**
 * Suppress expression components below a threshold fraction of the max.
 */
function suppressWeakComponents(expression: Float32Array, threshold: number): void {
  let maxAbs = 0;
  for (let i = 0; i < expression.length; i++) {
    maxAbs = Math.max(maxAbs, Math.abs(expression[i]));
  }
  if (maxAbs === 0) return;

  const cutoff = maxAbs * threshold;
  for (let i = 0; i < expression.length; i++) {
    if (Math.abs(expression[i]) < cutoff) {
      expression[i] *= 0.2; // suppress, don't zero — keep a trace
    }
  }
}
