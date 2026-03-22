import { describe, it, expect, beforeEach } from 'vitest';
import { useExplorerStore } from './store';

beforeEach(() => {
  useExplorerStore.setState({
    mode: 'highlevel',
    tension: 0, valence: 0,
    stature: 0,
    poseOverride: false, pitch: 0, yaw: 0, roll: 0, jawOpen: 0,
    gazeOverride: false, gazeHorizontal: 0, gazeVertical: 0,
    flush: 0, fatigueTex: 0,
    rawShape: new Float32Array(100),
    rawExpression: new Float32Array(100),
    currentParams: null,
  });
});

describe('ExplorerStore (circumplex)', () => {
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

  it('tension drives upper face only (ψ9 eyes wide, no ψ7 change)', () => {
    useExplorerStore.getState().setTension(0.8);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.expression[9]).toBeGreaterThan(0);  // eyes wide
    expect(p.expression[7]).toBe(0);  // ψ7 not owned by tension
  });

  it('valence good drives warm flush', () => {
    useExplorerStore.getState().setValence(0.8);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.flush).toBeGreaterThan(0);
  });

  it('valence bad drives pallor', () => {
    useExplorerStore.getState().setValence(-0.8);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.flush).toBeLessThan(0);
  });

  it('stature drives β components', () => {
    useExplorerStore.getState().setStature(0.8);
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

  it('tension does NOT affect valence-owned ψ components', () => {
    useExplorerStore.getState().setTension(1.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // Valence-owned: ψ0, ψ2, ψ3, ψ6, ψ7, ψ16, ψ26
    expect(expr[0]).toBe(0);
    expect(expr[2]).toBe(0);
    expect(expr[3]).toBe(0);
    expect(expr[6]).toBe(0);
    expect(expr[7]).toBe(0);
    expect(expr[16]).toBe(0);
    expect(expr[26]).toBe(0);
  });

  it('valence does NOT affect tension-owned ψ components', () => {
    useExplorerStore.getState().setValence(1.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // Tension-owned: ψ4, ψ5, ψ9, ψ20, ψ21, ψ24, ψ25
    expect(expr[4]).toBe(0);
    expect(expr[5]).toBe(0);
    expect(expr[9]).toBe(0);
    expect(expr[20]).toBe(0);
    expect(expr[21]).toBe(0);
    expect(expr[24]).toBe(0);
    expect(expr[25]).toBe(0);
  });
});
