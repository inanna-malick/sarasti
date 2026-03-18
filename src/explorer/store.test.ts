import { describe, it, expect, beforeEach } from 'vitest';
import { useExplorerStore } from './store';

beforeEach(() => {
  useExplorerStore.setState({
    mode: 'highlevel',
    joy: 0, anguish: 0, surprise: 0, tension: 0,
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

  it('joy drives ψ0 (jaw+cheeks) and ψ7 (brow)', () => {
    useExplorerStore.getState().setJoy(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ0 weight 2.3 × 3.0 = 6.9
    expect(expr[0]).toBeCloseTo(6.9);
    // ψ7 weight 1.2 × 3.0 = 3.6
    expect(expr[7]).toBeCloseTo(3.6);
  });

  it('anguish drives ψ6, ψ7, ψ8 (upper face)', () => {
    useExplorerStore.getState().setAnguish(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ6 weight 2.0 × 3.0 = 6.0
    expect(expr[6]).toBeCloseTo(6.0);
    // ψ7 weight -2.0 × 3.0 = -6.0
    expect(expr[7]).toBeCloseTo(-6.0);
    // ψ8 weight 1.5 × 3.0 = 4.5
    expect(expr[8]).toBeCloseTo(4.5);
  });

  it('surprise drives ψ4, ψ2, ψ0 (brow-dominant)', () => {
    useExplorerStore.getState().setSurprise(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ4 weight 2.3 × 3.0 = 6.9
    expect(expr[4]).toBeCloseTo(6.9);
    // ψ2 weight 1.5 × 3.0 = 4.5
    expect(expr[2]).toBeCloseTo(4.5);
    // ψ0 weight -1.0 × 3.0 = -3.0
    expect(expr[0]).toBeCloseTo(-3.0);
  });

  it('tension drives ψ3, ψ5, ψ8 (face-wide clench)', () => {
    useExplorerStore.getState().setTension(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ3 weight 2.0 × 3.0 = 6.0
    expect(expr[3]).toBeCloseTo(6.0);
    // ψ5 weight 1.5 × 3.0 = 4.5
    expect(expr[5]).toBeCloseTo(4.5);
    // ψ8 weight 1.0 × 3.0 = 3.0
    expect(expr[8]).toBeCloseTo(3.0);
  });

  it('joy + surprise combine additively on ψ0 (opposite directions)', () => {
    useExplorerStore.getState().setJoy(3.0);
    useExplorerStore.getState().setSurprise(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ0: joy 2.3×3 + surprise -1.0×3 = 6.9 - 3.0 = 3.9
    expect(expr[0]).toBeCloseTo(3.9);
  });

  it('joy + anguish conflict on ψ7 (bittersweet)', () => {
    useExplorerStore.getState().setJoy(3.0);
    useExplorerStore.getState().setAnguish(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ7: joy 1.2×3 + anguish -2.0×3 = 3.6 - 6.0 = -2.4
    expect(expr[7]).toBeCloseTo(-2.4);
  });

  it('anguish + tension stack on ψ8', () => {
    useExplorerStore.getState().setAnguish(3.0);
    useExplorerStore.getState().setTension(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ8: anguish 1.5×3 + tension 1.0×3 = 4.5 + 3.0 = 7.5
    expect(expr[8]).toBeCloseTo(7.5);
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
