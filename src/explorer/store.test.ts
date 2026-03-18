import { describe, it, expect, beforeEach } from 'vitest';
import { useExplorerStore } from './store';

beforeEach(() => {
  useExplorerStore.setState({
    mode: 'highlevel',
    valence: 0, aperture: 0, distress: 0, surprise: 0,
    width: 0, height: 0, jaw: 0,
    poseOverride: false, pitch: 0, yaw: 0, roll: 0, jawOpen: 0,
    gazeOverride: false, gazeHorizontal: 0, gazeVertical: 0,
    flush: 0, fatigue: 0,
    rawShape: new Float32Array(100),
    rawExpression: new Float32Array(100),
    currentParams: null,
  });
});

describe('ExplorerStore', () => {
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

  it('valence drives ψ1 (smile/frown) directly', () => {
    useExplorerStore.getState().setValence(2.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ1 weight is 3.0, so at valence=2: ψ1 = 6.0
    expect(expr[1]).toBeCloseTo(6.0);
    // ψ0 weight is 1.5, so ψ0 = 3.0
    expect(expr[0]).toBeCloseTo(3.0);
  });

  it('aperture drives ψ0 (jaw open) directly', () => {
    useExplorerStore.getState().setAperture(1.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    expect(expr[0]).toBeCloseTo(3.0); // weight 3.0
    expect(expr[2]).toBeCloseTo(2.5); // weight 2.5
  });

  it('multiple expression axes combine additively', () => {
    useExplorerStore.getState().setValence(1.0);
    useExplorerStore.getState().setAperture(1.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ0: valence 1.5 + aperture 3.0 = 4.5
    expect(expr[0]).toBeCloseTo(4.5);
  });

  it('shape width drives β0', () => {
    useExplorerStore.getState().setWidth(2.0);
    const shape = useExplorerStore.getState().currentParams!.shape;
    expect(shape[0]).toBeCloseTo(6.0); // weight 3.0 * 2.0
  });

  it('raw mode bypasses mappings', () => {
    useExplorerStore.getState().setMode('raw');
    const state = useExplorerStore.getState();
    expect(state.currentParams).not.toBeNull();
    expect(state.currentParams!.shape.every(v => v === 0)).toBe(true);
    expect(state.currentParams!.expression.every(v => v === 0)).toBe(true);
  });

  it('raw mode uses raw slider values directly', () => {
    useExplorerStore.getState().setMode('raw');
    useExplorerStore.getState().setRawShape(0, 3.5);
    useExplorerStore.getState().setRawExpression(2, -1.0);
    const params = useExplorerStore.getState().currentParams!;
    expect(params.shape[0]).toBe(3.5);
    expect(params.expression[2]).toBe(-1.0);
  });

  it('texture sliders work in both modes', () => {
    useExplorerStore.getState().setFlush(0.7);
    useExplorerStore.getState().setFatigue(-0.5);
    const params = useExplorerStore.getState().currentParams!;
    expect(params.flush).toBe(0.7);
    expect(params.fatigue).toBe(-0.5);
  });

  it('pose override replaces pose values', () => {
    useExplorerStore.getState().setPoseOverride(true);
    useExplorerStore.getState().setPitch(0.3);
    useExplorerStore.getState().setYaw(0.1);
    const params = useExplorerStore.getState().currentParams!;
    expect(params.pose.neck[0]).toBe(0.3);
    expect(params.pose.neck[1]).toBe(0.1);
  });

  it('gaze override replaces gaze values', () => {
    useExplorerStore.getState().setGazeOverride(true);
    useExplorerStore.getState().setGazeHorizontal(0.25);
    useExplorerStore.getState().setGazeVertical(-0.1);
    const params = useExplorerStore.getState().currentParams!;
    expect(params.pose.leftEye[0]).toBe(0.25);
    expect(params.pose.leftEye[1]).toBe(-0.1);
  });
});
