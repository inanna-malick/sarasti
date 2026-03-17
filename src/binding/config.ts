import type { BindingConfig } from './types';
import { EXPRESSION_INTENSITY_DEFAULT, MAX_DEVIATION_SIGMA } from '../constants';

/**
 * Default binding configuration — empirically tuned.
 *
 * Expression and shape indices determined by FLAME 2023 Open component sweep
 * (tools/flame-sweep.ts). Each register drives MULTIPLE high-variance FLAME
 * components simultaneously for dramatic, data-viz-grade face changes.
 *
 * Empirical FLAME 2023 Open component catalog (at ±5):
 *   ψ0: jaw open + smile (strongest expression axis)
 *   ψ1: smile/frown (cheeks raise vs corners drop)
 *   ψ2: mouth open extreme deformation (lips apart vs pressed)
 *   ψ3: lip parting / protrusion
 *   ψ4: brow raise/lower
 *   ψ5: lip pursing forward/back
 *   ψ6: jaw lateral shift
 *   ψ7: head shape modifier
 *   ψ8: subtle lip/nose
 *   ψ9: eye/cheek region
 *
 *   β0: face width/size (strongest shape axis)
 *   β1: face height (elongated vs compressed)
 *   β2: jaw shape (square vs pointed chin)
 *   β3: secondary width
 *   β4-β9: progressively finer shape details
 */
export const DEFAULT_BINDING_CONFIG: BindingConfig = {
  shape: {
    // β0 = face width, β1 = face height, β2 = jaw shape
    // Age: older → squarer jaw (β2+), elongated (β1+), slightly wider (β0+)
    age_indices: [0, 1, 2],
    // Class morphology: β0 (width), β3 (secondary width), β4 (detail)
    class_indices: [0, 3, 4],
    // Family resemblance: β5-β8
    family_indices: [5, 6, 7, 8],

    // Tier 2 (β₁₁₋₂₀)
    volume_indices: [11, 12, 13],
    hist_vol_indices: [14, 15, 16],
    corr_brent_indices: [17, 18, 19, 20], // Adjusted to include 20 as per doc β17-20

    // Tier 3 (β₂₁₋₅₀)
    corr_spy_indices: [21, 22, 23, 24, 25],
    market_cap_indices: [26, 27, 28, 29, 30],
    spread_indices: [31, 32, 33, 34, 35],
    skewness_indices: [36, 37, 38, 39, 40],
    residual_indices: Array.from({ length: 50 }, (_, i) => 50 + i),
  },

  expression: {
    // SIGNIFICANT DRAWDOWN: market falling — extreme deformation. Jaw open, mouth wide, brow furrowed, frown.
    // ψ0+ jaw open (deformation), ψ2+ mouth open wide, ψ1- frown (corners down),
    // ψ4+ brow furrow/squint, ψ9+ brow tension, ψ3+ lip part
    distress: {
      indices: [0, 2, 1, 4, 9, 3],
      weights: [1.0, 1.0, -0.8, 0.7, 0.6, 0.5],
    },

    // SHOCK: unexpected spike — gasp. Jaw drops, eyes wide, brow raised.
    // ψ0+ jaw open, ψ2+ mouth open, ψ4- eyes wide (anti-squint),
    // ψ9- brow raise (unfurrow), ψ3+ lip part, ψ1+ slight smile (ironic)
    shock: {
      indices: [0, 2, 4, 9, 3, 1],
      weights: [1.0, 0.9, -0.7, -0.6, 0.5, 0.2],
    },

    // RELIEF: recovery — smile, relaxed jaw, soft.
    // ψ1+ smile, ψ0+ jaw relax, ψ4- eyes relax, ψ9- brow relax
    relief: {
      indices: [1, 0, 4, 9, 5],
      weights: [1.0, 0.3, -0.4, -0.3, -0.2],
    },

    // SUSTAINED VOLATILITY: grinding sustained negative — persistent deformation, tight, furrowed.
    // ψ0+ jaw open (but less than drawdown), ψ1- deep frown,
    // ψ4+ heavy squint, ψ9+ intense brow furrow, ψ2+ lips apart,
    // ψ7 chin tension, ψ6 asymmetry (face breaks symmetry under strain)
    dread: {
      indices: [0, 1, 4, 9, 2, 7, 6],
      weights: [0.6, -1.0, 0.8, 0.9, 0.5, 0.4, 0.3],
    },

    // ─── Tier 2 (ψ₁₆₋₂₀): alertness/exhaustion ──────────
    // volume_anomaly: surge (>1) → alertness, collapse (<1) → exhaustion
    // ψ9: eye/cheek region, ψ16-19: tier 2 components
    alertness: {
      indices: [9, 16, 17, 18, 19],
      weights: [1.0, 0.8, 0.7, 0.5, 0.4],
    },
    exhaustion: {
      indices: [9, 16, 17, 18, 19],
      weights: [-1.0, -0.8, -0.7, -0.5, -0.4],
    },

    // ─── Tier 3 (ψ₂₁₋₄₀): structural expressions ────────
    // Indices and weights for correlation breakdown, term structure, contagion, and strain
    corr_breakdown: {
      indices: [21, 22, 23, 24, 25],
      weights: [1.0, 0.9, 0.8, 0.7, 0.6],
    },
    term_structure: {
      indices: [26, 27, 28, 29, 30],
      weights: [1.0, 0.9, 0.8, 0.7, 0.6],
    },
    contagion: {
      indices: [31, 32, 33, 34, 35],
      weights: [1.0, 0.9, 0.8, 0.7, 0.6],
    },
    strain: {
      indices: [36, 37, 38, 39, 40],
      weights: [1.0, 0.9, 0.8, 0.7, 0.6],
    },
  },

  // Sigmoid: dev ±0.1 → ~40% intensity, dev ±0.3 → ~85%, dev ±0.5+ → saturates
  deviation_curve: {
    type: 'sigmoid',
    input_min: -MAX_DEVIATION_SIGMA,
    input_max: MAX_DEVIATION_SIGMA,
    output_min: -1,
    output_max: 1,
    steepness: 4,
  },

  // Velocity: wider range than deviation — velocity can spike harder
  velocity_curve: {
    type: 'exponential',
    input_min: -3.0,
    input_max: 3.0,
    output_min: -1,
    output_max: 1,
    steepness: 3,
  },

  // Volatility: linear, range matched to typical market vol (0–3)
  volatility_curve: {
    type: 'linear',
    input_min: 0,
    input_max: 3,
    output_min: 0,
    output_max: 1,
    steepness: 1,
  },

  // Volume anomaly: 0 (collapse) → -1 (exhaustion), 1 (neutral) → 0, 2 (surge) → 1 (alertness)
  volume_anomaly_curve: {
    type: 'linear',
    input_min: 0,
    input_max: 2,
    output_min: -1,
    output_max: 1,
    steepness: 1,
  },

  // Correlation breakdown: 0 (no breakdown) → 0, 1 (max breakdown) → 1
  corr_breakdown_curve: {
    type: 'linear',
    input_min: 0,
    input_max: 1,
    output_min: 0,
    output_max: 1,
    steepness: 1,
  },

  // Term slope: typical range -0.5 to 0.5
  term_slope_curve: {
    type: 'linear',
    input_min: -0.5,
    input_max: 0.5,
    output_min: -1,
    output_max: 1,
    steepness: 1,
  },

  // Cross-asset contagion: rolling correlation 0 to 1
  cross_contagion_curve: {
    type: 'linear',
    input_min: 0,
    input_max: 1,
    output_min: 0,
    output_max: 1,
    steepness: 1,
  },

  // High-low ratio (spread proxy): typical values 0 to 0.05
  high_low_ratio_curve: {
    type: 'linear',
    input_min: 0,
    input_max: 0.05,
    output_min: 0,
    output_max: 1,
    steepness: 1,
  },

  expression_intensity: EXPRESSION_INTENSITY_DEFAULT,

  // Per-tier intensity scaling: [tier1, tier2, tier3, sarasti]
  tier_intensities: [1.0, 0.5, 0.2, 1.0],

  // Per-class shape profiles: [β_index, value] pairs
  // Using high-variance components for maximum visual distinction
  class_profiles: {
    // Energy: wide, heavy, square jaw (β0+ width, β3+ secondary, β2+ square jaw)
    energy:   [[0, 2.0], [3, 1.5], [4, -0.5]],
    // Volatility-Sensitive: narrow, sharp, elongated (β0- narrow, β1+ tall, β3- angular)
    fear:     [[0, -2.0], [1, 1.5], [3, -1.0]],
    // Currency: neutral baseline, slightly compressed
    currency: [[0, 0.0], [1, -0.5], [3, 0.3]],
    // Commodity: blocky, dense — wide and square (β0+ wide, β2+ square, β3+ heavy)
    commodity: [[0, 1.5], [2, 1.0], [3, 1.0]],
    // Equity: round, soft, wide but short (β0+ wide, β1- short, β2- soft chin)
    equity:   [[0, 1.0], [1, -1.0], [4, 0.8]],
    // Media: most angular/alien — narrow, elongated, sharp chin (β0- narrow, β1+ tall, β2- pointed)
    media:    [[0, -2.5], [1, 2.0], [4, -1.2]],
  },

  // Per-family perturbations from class profile
  // Using β5-β8 for family-level distinction
  family_profiles: {
    brent:    [[5, -0.8], [6, 0.6], [7, 0.0], [8, 0.3]],
    wti:      [[5, 0.8], [6, 0.3], [7, -0.2], [8, -0.3]],
    natgas:   [[5, -0.4], [6, -0.5], [7, 0.6], [8, 0.4]],
    distill:  [[5, 0.3], [6, -0.7], [7, -0.3], [8, 0.6]],
    consumer: [[5, 1.0], [6, -0.8], [7, 0.4], [8, -0.5]],
    vol:      [[5, -1.2], [6, 1.0], [7, -0.8], [8, 0.8]],
    haven:    [[5, 0.5], [6, 0.5], [7, 0.5], [8, 0.5]],
    currency: [[5, 0.0], [6, 0.0], [7, 0.3], [8, -0.3]],
    rates:    [[5, -0.3], [6, 0.3], [7, -0.3], [8, 0.3]],
    sector:   [[5, 0.7], [6, -0.3], [7, 0.7], [8, -0.3]],
    broad:    [[5, 0.0], [6, 0.0], [7, 0.0], [8, 0.0]],
    gdelt:    [[5, -1.5], [6, 1.5], [7, 1.2], [8, -1.2]],
  },

  // Tier 2/3 shape response curves (normalized ranges based on census data)
  avg_volume_curve: {
    type: 'sigmoid',
    input_min: 0,
    input_max: 200000,
    output_min: 0,
    output_max: 1,
    steepness: 4,
  },

  hist_vol_curve: {
    type: 'linear',
    input_min: 0,
    input_max: 0.05,
    output_min: 0,
    output_max: 1,
    steepness: 1,
  },

  corr_brent_curve: {
    type: 'linear',
    input_min: -1,
    input_max: 1,
    output_min: -1,
    output_max: 1,
    steepness: 1,
  },

  corr_spy_curve: {
    type: 'linear',
    input_min: -1,
    input_max: 1,
    output_min: -1,
    output_max: 1,
    steepness: 1,
  },

  spread_curve: {
    type: 'linear',
    input_min: -0.1,
    input_max: 0.1,
    output_min: -1,
    output_max: 1,
    steepness: 1,
  },

  skewness_curve: {
    type: 'linear',
    input_min: -1,
    input_max: 1,
    output_min: -1,
    output_max: 1,
    steepness: 1,
  },
};
