import { describe, it, expect, beforeEach } from 'vitest';
import { useExplorerStore } from './store';

beforeEach(() => {
  useExplorerStore.setState({
    mode: 'highlevel',
    alarm: 0, fatigue: 0,
    dominance: 0,
    poseOverride: false, pitch: 0, yaw: 0, roll: 0, jawOpen: 0,
    gazeOverride: false, gazeHorizontal: 0, gazeVertical: 0,
    flush: 0, fatigueTex: 0,
    rawShape: new Float32Array(100),
    rawExpression: new Float32Array(100),
    currentParams: null,
  });
});

describe('ExplorerStore (6-axis high-level)', () => {
  it('produces valid FaceParams after recompute', () => {
    useExplorerStore.getState().recompute();
    const { currentParams } = useExplorerStore.getState();
    expect(currentParams).not.toBeNull();
    expect(currentParams!.shape).toBeInstanceOf(Float32Array);
    expect(currentParams!.expression).toBeInstanceOf(Float32Array);
    expect(currentParams!.shape.length).toBe(100);
    expect(currentParams!.expression.length).toBe(100);
    expect(currentParams!.pose.neck).toHaveLength(3);
  });

  it('alarm drives gaze up (scanning)', () => {
    useExplorerStore.getState().setAlarm(2.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.pose.leftEye[1]).toBeGreaterThan(0);  // gaze up
  });

  it('alarm euphoric drives flush negative (pallid)', () => {
    useExplorerStore.getState().setAlarm(-3.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.flush).toBeLessThan(0);
  });

  it('fatigue wired drives fatigue texture negative', () => {
    useExplorerStore.getState().setFatigue(2.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.fatigue).toBeLessThan(0);  // wired
  });

  it('wired fatigue drives gaze lateral', () => {
    useExplorerStore.getState().setFatigue(2.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.pose.leftEye[0]).toBeGreaterThan(0);  // tracking lateral
  });

  it('dominance drives β components', () => {
    useExplorerStore.getState().setDominance(3.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.shape[3]).toBeGreaterThan(0);  // jaw width
  });

  it('raw mode bypasses high-level mappings', () => {
    useExplorerStore.getState().setMode('raw');
    const state = useExplorerStore.getState();
    expect(state.currentParams).not.toBeNull();
    expect(state.currentParams!.shape.every(v => v === 0)).toBe(true);
    expect(state.currentParams!.expression.every(v => v === 0)).toBe(true);
  });

  it('ψ7 is clamped in high-level mode', () => {
    useExplorerStore.getState().setAlarm(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    expect(expr[7]).toBeLessThanOrEqual(4.0);
    expect(expr[7]).toBeGreaterThanOrEqual(-4.0);
  });
});
