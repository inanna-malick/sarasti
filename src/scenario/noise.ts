/**
 * Micro-Life — two-layer noise for scenario faces.
 *
 * Layer 1: Continuous physiological noise (breathing, drift, sway)
 * Layer 2: Stochastic micro-events (glances, twitches, micro-frowns, swallows, sighs)
 *
 * Fully deterministic: same faceId + same time = same result.
 */

import type { InterpolatedState } from './types';

// ─── Deterministic hash ───────────────────────────────

/** Simple deterministic hash → [0, 1) */
function hash(s: string): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return ((h >>> 0) % 65521) / 65521;
}

/** Hash with two keys */
function hash2(a: string, b: string): number {
  return hash(a + ':' + b);
}

// ─── Layer 1: Continuous Physiological Noise ──────────

// Irrational frequency ratios prevent repetition
const BREATHING_HZ = 0.12;
const DRIFT_HZ = 0.07;
const SWAY_HZ = 0.05;

interface ContinuousNoise {
  tension: number;
  valence: number;
  pitch: number;
  yaw: number;
  roll: number;
}

function continuousNoise(faceId: string, t: number, tensionScale: number): ContinuousNoise {
  const phase = hash(faceId) * Math.PI * 2;
  const TWO_PI = Math.PI * 2;

  // Breathing: tension + slight pitch nod
  const breathPhase = TWO_PI * BREATHING_HZ * t + phase;
  const breath = Math.sin(breathPhase);

  // Muscle drift: slow valence wander
  const driftPhase = TWO_PI * DRIFT_HZ * t + phase * 1.618; // golden ratio offset
  const drift = Math.sin(driftPhase);

  // Postural sway: yaw + roll
  const swayPhase = TWO_PI * SWAY_HZ * t + phase * 2.414; // silver ratio offset
  const sway = Math.sin(swayPhase);
  const swayB = Math.sin(swayPhase * 1.318); // second sway harmonic

  const scale = tensionScale;
  return {
    tension: breath * 0.08 * scale,
    valence: drift * 0.05 * scale,
    pitch: breath * 0.025 * scale,
    yaw: sway * 0.02 * scale,
    roll: swayB * 0.02 * scale,
  };
}

// ─── Layer 2: Stochastic Micro-Events ─────────────────

interface MicroEvent {
  name: string;
  meanInterval: number; // seconds between events
  duration: number;     // seconds
  apply: (envelope: number, variation: number) => Partial<InterpolatedState>;
}

const MICRO_EVENTS: MicroEvent[] = [
  {
    name: 'glance',
    meanInterval: 8,
    duration: 0.4,
    apply: (env, v) => ({
      gazeH: env * 0.20 * (v > 0.5 ? 1 : -1),
      gazeV: env * 0.08 * (v > 0.7 ? 1 : v < 0.3 ? -1 : 0),
    }),
  },
  {
    name: 'twitch',
    meanInterval: 14,
    duration: 0.25,
    apply: (env) => ({ tension: env * 0.15 }),
  },
  {
    name: 'microfrown',
    meanInterval: 16,
    duration: 0.5,
    apply: (env) => ({ valence: env * -0.10 }),
  },
  {
    name: 'swallow',
    meanInterval: 20,
    duration: 0.2,
    apply: (env) => ({ pitch: env * 0.03, tension: env * 0.08 }),
  },
  {
    name: 'sigh',
    meanInterval: 27,
    duration: 0.6,
    apply: (env, v) => ({
      tension: env * -0.10,
      roll: env * 0.01 * (v > 0.5 ? 1 : -1),
    }),
  },
];

/** Smoothstep envelope: fast attack (20%), sustain at peak (30%), slow decay (50%) */
function envelope(progress: number): number {
  if (progress < 0 || progress > 1) return 0;
  if (progress < 0.2) {
    // Attack: smoothstep 0→1
    const t = progress / 0.2;
    return t * t * (3 - 2 * t);
  }
  if (progress < 0.5) {
    return 1; // Sustain
  }
  // Decay: smoothstep 1→0
  const t = (progress - 0.5) / 0.5;
  return 1 - t * t * (3 - 2 * t);
}

function stochasticEvents(
  faceId: string,
  t: number,
): Partial<InterpolatedState> {
  const result: Record<string, number> = {};

  for (const event of MICRO_EVENTS) {
    const window = Math.floor(t / event.meanInterval);
    const key = `${faceId}:${event.name}:${window}`;

    // Does this event fire in this window?
    const fireHash = hash(key);
    if (fireHash > 0.7) continue; // ~30% skip rate per window

    // When within the window does it fire?
    const offsetHash = hash2(key, 'offset');
    const fireTime = window * event.meanInterval + offsetHash * (event.meanInterval - event.duration);

    // Amplitude variation ±20%
    const ampHash = hash2(key, 'amp');
    const ampVariation = 0.8 + ampHash * 0.4;

    // Are we within this event's envelope?
    const elapsed = t - fireTime;
    if (elapsed < 0 || elapsed > event.duration) continue;

    const env = envelope(elapsed / event.duration) * ampVariation;
    const directionHash = hash2(key, 'dir');
    const effects = event.apply(env, directionHash);

    // Accumulate
    for (const [k, v] of Object.entries(effects)) {
      if (v !== undefined && typeof v === 'number') {
        result[k] = (result[k] ?? 0) + v;
      }
    }
  }

  return result;
}

// ─── Public API ───────────────────────────────────────

/** Apply continuous noise + stochastic micro-events to interpolated state. */
export function applyMicroLife(
  faceId: string,
  t: number,
  state: InterpolatedState,
): InterpolatedState {
  // Tension-scaled amplitude: tenser faces fidget more
  const tensionScale = 0.4 + 0.6 * Math.abs(state.tension);

  const continuous = continuousNoise(faceId, t, tensionScale);
  const events = stochasticEvents(faceId, t);

  const add = (base: number | undefined, ...deltas: (number | undefined)[]) => {
    let v = base ?? 0;
    for (const d of deltas) if (d !== undefined) v += d;
    return v;
  };

  return {
    ...state,
    tension: Math.max(-1, Math.min(1, state.tension + continuous.tension + (events.tension ?? 0))),
    valence: Math.max(-1, Math.min(1, state.valence + continuous.valence + (events.valence ?? 0))),
    pitch: add(state.pitch, continuous.pitch, events.pitch),
    yaw: add(state.yaw, continuous.yaw, events.yaw),
    roll: add(state.roll, continuous.roll, events.roll),
    gazeH: events.gazeH !== undefined ? add(state.gazeH, events.gazeH) : state.gazeH,
    gazeV: events.gazeV !== undefined ? add(state.gazeV, events.gazeV) : state.gazeV,
  };
}
