import { describe, it, expect, beforeEach } from 'vitest';
import { useExplorerStore } from './store';

beforeEach(() => {
  useExplorerStore.setState({
    mode: 'highlevel',
    alarm: 0, valence: 0, arousal: 0,
    dominance: 0, stature: 0,
    poseOverride: false, pitch: 0, yaw: 0, roll: 0, jawOpen: 0,
    gazeOverride: false, gazeHorizontal: 0, gazeVertical: 0,
    flush: 0, fatigue: 0,
    rawShape: new Float32Array(100),
    rawExpression: new Float32Array(100),
    currentParams: null,
  });
});

describe('ExplorerStore (chord axes)', () => {
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

  // --- Alarm axis: ψ0 × 1.0, ψ2 × 2.0, ψ8 × 1.5 ---
  it('alarm drives ψ0 (jaw seasoning), ψ2 (brow up), ψ8 (nose wrinkle)', () => {
    useExplorerStore.getState().setAlarm(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    expect(expr[0]).toBeCloseTo(3.0);   // ψ0: 1.0 × 3.0
    expect(expr[2]).toBeCloseTo(6.0);   // ψ2: 2.0 × 3.0
    expect(expr[8]).toBeCloseTo(4.5);   // ψ8: 1.5 × 3.0
  });

  // --- Valence axis: ψ0 × 1.5, ψ9 × 3.0, ψ7 × 1.5, ψ8 × 0.5 ---
  it('valence positive drives ψ9 (cheek puff), ψ0 (jaw open), ψ7 (Duchenne)', () => {
    useExplorerStore.getState().setValence(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    expect(expr[9]).toBeCloseTo(9.0);   // ψ9: 3.0 × 3.0
    expect(expr[0]).toBeCloseTo(4.5);   // ψ0: 1.5 × 3.0
    expect(expr[7]).toBeCloseTo(4.5);   // ψ7: 1.5 × 3.0
    expect(expr[8]).toBeCloseTo(1.5);   // ψ8: 0.5 × 3.0
  });

  it('valence negative drives ψ9 negative (cheek deflate)', () => {
    useExplorerStore.getState().setValence(-3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    expect(expr[9]).toBeCloseTo(-9.0);  // ψ9: 3.0 × -3.0
    expect(expr[0]).toBeCloseTo(-4.5);  // ψ0: 1.5 × -3.0
  });

  // --- Arousal axis: ψ2 × 3.0, ψ7 × -1.5 ---
  it('arousal positive drives ψ2 (brow raise), ψ7 (eyes open)', () => {
    useExplorerStore.getState().setArousal(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    expect(expr[2]).toBeCloseTo(9.0);   // ψ2: 3.0 × 3.0
    expect(expr[7]).toBeCloseTo(-4.5);  // ψ7: -1.5 × 3.0
  });

  // --- Chord combination tests ---
  it('alarm + arousal stack on ψ2 (brow rockets up)', () => {
    useExplorerStore.getState().setAlarm(3.0);
    useExplorerStore.getState().setArousal(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ2: alarm 2.0×3 + arousal 3.0×3 = 6.0 + 9.0 = 15.0
    expect(expr[2]).toBeCloseTo(15.0);
  });

  // --- Shape axes ---
  it('dominance drives β3 (jaw), β2 (chin), β0 (neck), β4 (brow), β7, β18, β23', () => {
    useExplorerStore.getState().setDominance(3.0);
    const shape = useExplorerStore.getState().currentParams!.shape;
    expect(shape[3]).toBeCloseTo(9.0);  // β3: 3.0 × 3.0
    expect(shape[2]).toBeCloseTo(6.0);  // β2: 2.0 × 3.0
    expect(shape[0]).toBeCloseTo(6.0);  // β0: 2.0 × 3.0
    expect(shape[4]).toBeCloseTo(4.5);  // β4: 1.5 × 3.0
    expect(shape[7]).toBeCloseTo(3.0);  // β7: 1.0 × 3.0
    expect(shape[18]).toBeCloseTo(9.0); // β18: 3.0 × 3.0
    expect(shape[23]).toBeCloseTo(9.0); // β23: 3.0 × 3.0
  });

  it('stature drives β1 (face length), β6 (cheekbone), β5 (nasal), β8 (mouth), β32', () => {
    useExplorerStore.getState().setStature(3.0);
    const shape = useExplorerStore.getState().currentParams!.shape;
    expect(shape[1]).toBeCloseTo(9.0);  // β1: 3.0 × 3.0
    expect(shape[6]).toBeCloseTo(6.0);  // β6: 2.0 × 3.0
    expect(shape[5]).toBeCloseTo(4.5);  // β5: 1.5 × 3.0
    expect(shape[8]).toBeCloseTo(3.6);  // β8: 1.2 × 3.0
    expect(shape[32]).toBeCloseTo(9.0); // β32: 3.0 × 3.0
  });

  it('shape axes have zero component overlap', () => {
    useExplorerStore.getState().setDominance(3.0);
    useExplorerStore.getState().setStature(3.0);
    const shape = useExplorerStore.getState().currentParams!.shape;

    // Dominance components (β0, β2, β3, β4, β7, β18, β23)
    expect(shape[0]).toBeCloseTo(6.0);
    expect(shape[2]).toBeCloseTo(6.0);
    expect(shape[3]).toBeCloseTo(9.0);
    expect(shape[4]).toBeCloseTo(4.5);
    expect(shape[7]).toBeCloseTo(3.0);
    expect(shape[18]).toBeCloseTo(9.0);
    expect(shape[23]).toBeCloseTo(9.0);

    // Stature components (β1, β5, β6, β8, β32)
    expect(shape[1]).toBeCloseTo(9.0);
    expect(shape[5]).toBeCloseTo(4.5);
    expect(shape[6]).toBeCloseTo(6.0);
    expect(shape[8]).toBeCloseTo(3.6);
    expect(shape[32]).toBeCloseTo(9.0);
  });

  it('negative dominance produces soyboi face', () => {
    useExplorerStore.getState().setDominance(-3.0);
    const shape = useExplorerStore.getState().currentParams!.shape;
    expect(shape[3]).toBeCloseTo(-9.0);  // tapered jaw
    expect(shape[2]).toBeCloseTo(-6.0);  // recessed chin
  });

  // --- Raw mode, texture, pose, gaze ---
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
