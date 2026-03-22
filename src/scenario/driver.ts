/**
 * ScenarioDriver — plays a scenario by interpolating keyframes and
 * resolving them through the full chord pipeline.
 *
 * Data flow:
 *   TimelineEngine rAF → fractional time
 *   → interpolateKeyframes per face → {tension, valence, stature}
 *   → resolveFromCircumplex → FaceParams
 *   → FaceInstance[] with grid positions
 *   → renderer.setInstances()
 */

import type { FaceRenderer, FaceInstance, FaceParams, TickerConfig } from '../types';
import type { Scenario, ScenarioFace, InterpolatedState } from './types';
import { interpolateKeyframes } from './interpolate';
import { applyMicroLife } from './noise';
import { resolveFromCircumplex } from '../binding/resolve';
import { TimelineEngine } from '../timeline/engine';
import { FACE_SPACING } from '../constants';

const SCENARIO_FPS = 30;

/** Compute world-space positions for scenario faces on a grid */
function computeGridPositions(
  faces: ScenarioFace[],
  grid: [number, number],
): Map<string, [number, number, number]> {
  const [cols, rows] = grid;
  const spacing = FACE_SPACING;
  const positions = new Map<string, [number, number, number]>();

  const gridW = (cols - 1) * spacing;
  const gridH = (rows - 1) * spacing;

  for (const face of faces) {
    const [col, row] = face.position;
    const x = -gridW / 2 + col * spacing;
    const y = gridH / 2 - row * spacing;
    positions.set(face.id, [x, y, 0]);
  }

  return positions;
}

/**
 * Compute gaze direction from one face toward another face's grid position.
 * Returns gazeH (horizontal) and gazeV (vertical) in radians.
 */
function computeGazeToward(
  fromPos: [number, number, number],
  toPos: [number, number, number],
): { gazeH: number; gazeV: number } {
  const dx = toPos[0] - fromPos[0];
  const dy = toPos[1] - fromPos[1];
  // Approximate: grid spacing ~2.5 units, max gaze ~0.5 rad
  // Scale so faces 1 grid space apart get ~0.15 rad gaze offset
  const dist = Math.sqrt(dx * dx + dy * dy);
  const scale = dist > 0 ? Math.min(0.4 / dist, 0.2) : 0;
  return {
    gazeH: dx * scale,
    gazeV: dy * scale * 0.5, // vertical gaze is more subtle
  };
}

/** Stub TickerConfig for scenario faces (not real market data) */
function stubTicker(faceId: string): TickerConfig {
  return {
    id: faceId,
    name: faceId,
    class: 'equity',
    family: 'scenario',
    age: 30,
  };
}

/** Stub TickerFrame (zeros — not used for binding, but required by FaceInstance) */
const STUB_FRAME = {
  close: 0, volume: 0, deviation: 0, velocity: 0, volatility: 0,
  drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 0,
};

export type ScenarioEventCallback = (event: 'play' | 'pause' | 'seek' | 'end') => void;

export class ScenarioDriver {
  private scenario: Scenario;
  private renderer: FaceRenderer;
  private engine: TimelineEngine;
  private positions: Map<string, [number, number, number]>;
  private faceMap: Map<string, ScenarioFace>;
  private listeners: ScenarioEventCallback[] = [];
  private _disposed = false;
  private _speedMultiplier = 1;

  constructor(scenario: Scenario, renderer: FaceRenderer) {
    this.scenario = scenario;
    this.renderer = renderer;

    // Compute grid positions
    this.positions = computeGridPositions(scenario.faces, scenario.grid);

    // Build face lookup
    this.faceMap = new Map();
    for (const face of scenario.faces) {
      this.faceMap.set(face.id, face);
    }

    // Create timeline engine: duration × fps = frame count
    const frameCount = Math.ceil(scenario.duration * SCENARIO_FPS);
    this.engine = new TimelineEngine(frameCount);
    this.engine.setSpeed(SCENARIO_FPS); // 30 frames/sec = real-time
    this.engine.setLoop(false);

    // Render on every rAF
    this.engine.onContinuous((position) => {
      const t = position / SCENARIO_FPS; // convert frame position to seconds
      this.renderFrame(t);
    });

    // Render initial frame
    this.renderFrame(0);
  }

  /** Render all faces at time t (seconds) */
  private renderFrame(t: number): void {
    if (this._disposed) return;

    // First pass: interpolate all faces to get states + positions (needed for gaze)
    const states = new Map<string, InterpolatedState>();
    for (const face of this.scenario.faces) {
      const keyframes = this.scenario.curves[face.id];
      if (!keyframes || keyframes.length === 0) {
        states.set(face.id, { tension: 0, valence: 0, stature: 0 });
        continue;
      }
      states.set(face.id, interpolateKeyframes(keyframes, t));
    }

    // Apply micro-life noise to each face's interpolated state
    for (const face of this.scenario.faces) {
      const raw = states.get(face.id)!;
      states.set(face.id, applyMicroLife(face.id, t, raw));
    }

    // Second pass: resolve to FaceParams with gaze tracking
    const instances: FaceInstance[] = [];
    for (const face of this.scenario.faces) {
      const state = states.get(face.id)!;
      const pos = this.positions.get(face.id)!;

      // Compute gaze override from gazeTarget
      let gazeOverride: { gazeH: number; gazeV: number } | undefined;
      if (state.gazeTarget && this.positions.has(state.gazeTarget)) {
        const targetPos = this.positions.get(state.gazeTarget)!;
        const gaze = computeGazeToward(pos, targetPos);
        const blend = state.gazeBlend ?? 1;
        gazeOverride = {
          gazeH: gaze.gazeH * blend,
          gazeV: gaze.gazeV * blend,
        };
      }

      const params = resolveFromCircumplex(
        { tension: state.tension, valence: state.valence, stature: state.stature },
        face.id,
        {
          flush: state.flush,
          fatigue: state.fatigue,
          gazeH: state.gazeH ?? gazeOverride?.gazeH,
          gazeV: state.gazeV ?? gazeOverride?.gazeV,
          pitch: state.pitch,
          yaw: state.yaw,
          roll: state.roll,
        },
      );

      instances.push({
        id: face.id,
        params,
        position: pos,
        ticker: stubTicker(face.id),
        frame: STUB_FRAME,
      });
    }

    this.renderer.setInstances(instances);
  }

  // ─── Playback controls ─────────────────────────────

  play(): void {
    this.engine.play();
    this.notify('play');
  }

  pause(): void {
    this.engine.pause();
    this.notify('pause');
  }

  togglePlay(): void {
    if (this.engine.state.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  /** Seek to a normalized position [0, 1] */
  seekNormalized(fraction: number): void {
    const frameCount = Math.ceil(this.scenario.duration * SCENARIO_FPS);
    const frame = Math.round(fraction * (frameCount - 1));
    this.engine.seek(frame);
    this.notify('seek');
  }

  /** Current playback position as fraction [0, 1] */
  get progress(): number {
    const frameCount = Math.ceil(this.scenario.duration * SCENARIO_FPS);
    return frameCount > 1 ? this.engine.fractionalPosition / (frameCount - 1) : 0;
  }

  /** Current time in seconds */
  get currentTime(): number {
    return this.engine.fractionalPosition / SCENARIO_FPS;
  }

  get isPlaying(): boolean {
    return this.engine.state.playing;
  }

  get duration(): number {
    return this.scenario.duration;
  }

  /** Set playback speed multiplier (e.g. 0.25 for slow-mo, 4 for fast) */
  setSpeed(multiplier: number): void {
    this.engine.setSpeed(SCENARIO_FPS * multiplier);
    this._speedMultiplier = multiplier;
  }

  get speed(): number {
    return this._speedMultiplier;
  }

  setLoop(loop: boolean): void {
    this.engine.setLoop(loop);
  }

  get looping(): boolean {
    return this.engine.state.loop;
  }

  onEvent(cb: ScenarioEventCallback): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify(event: 'play' | 'pause' | 'seek' | 'end'): void {
    for (const cb of this.listeners) cb(event);
  }

  dispose(): void {
    this._disposed = true;
    this.engine.dispose();
    this.listeners = [];
  }
}
