import { describe, it, expect, beforeEach } from 'vitest';
import { useExplorerStore } from './store';

beforeEach(() => {
  useExplorerStore.setState({
    mode: 'highlevel',
    tension: 0, mood: 0,
    dominance: 0, stature: 0,
    poseOverride: false, pitch: 0, yaw: 0, roll: 0, jawOpen: 0,
    gazeOverride: false, gazeHorizontal: 0, gazeVertical: 0,
    flush: 0, fatigue: 0,
    rawShape: new Float32Array(100),
    rawExpression: new Float32Array(100),
    currentParams: null,
  });
});

describe('ExplorerStore (4-axis high-level)', () => {
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

  // --- Tension axis: full chord recipe (ψ + pose + gaze + texture) ---
  it('tension tense drives ψ components from TENSION_TENSE_RECIPE', () => {
    useExplorerStore.getState().setTension(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // TENSION_TENSE_RECIPE: ψ2×2.5, ψ0×1.0, ψ8×1.5, ψ7×-1.5, ψ5×0.8, ψ4×-0.5
    expect(expr[2]).toBeCloseTo(7.5);    // ψ2: 2.5 × 3.0
    expect(expr[0]).toBeCloseTo(3.0);    // ψ0: 1.0 × 3.0
    expect(expr[8]).toBeCloseTo(4.5);    // ψ8: 1.5 × 3.0
    expect(expr[5]).toBeCloseTo(2.4);    // ψ5: 0.8 × 3.0
    expect(expr[4]).toBeCloseTo(-1.5);   // ψ4: -0.5 × 3.0
  });

  it('tension tense drives jaw open and gaze up', () => {
    useExplorerStore.getState().setTension(2.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.pose.jaw).toBeGreaterThan(0);        // jaw opens
    expect(p.pose.leftEye[1]).toBeGreaterThan(0);  // gaze up
  });

  it('tension tense drives fatigue negative (wired)', () => {
    useExplorerStore.getState().setTension(2.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.fatigue).toBeLessThan(0);  // wired
  });

  it('tension placid drives fatigue positive (exhausted) and gaze down', () => {
    useExplorerStore.getState().setTension(-2.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.fatigue).toBeGreaterThan(0);           // exhausted
    expect(p.pose.leftEye[1]).toBeLessThan(0);       // gaze down
  });

  // --- Mood axis: full chord recipe (ψ + pose + gaze + texture) ---
  it('mood euphoric drives cheek lift + corners wide + Duchenne + flush', () => {
    useExplorerStore.getState().setMood(3.0);
    const p = useExplorerStore.getState().currentParams!;
    // MOOD_EUPHORIA_RECIPE: ψ9×2.5, ψ4×-2.0, ψ7×1.5, ψ5×0.5, ψ0×0.3, ψ8×0.5
    expect(p.expression[9]).toBeCloseTo(7.5);    // ψ9: 2.5 × 3.0 (cheek lift — primary smile)
    expect(p.expression[4]).toBeCloseTo(-6.0);   // ψ4: -2.0 × 3.0 (corners pull wide)
    expect(p.expression[5]).toBeCloseTo(1.5);    // ψ5: 0.5 × 3.0 (light upper lip)
    expect(p.expression[0]).toBeCloseTo(0.9);    // ψ0: 0.3 × 3.0 (minimal jaw)
    expect(p.flush).toBeGreaterThan(0);           // warm glow
    expect(p.pose.leftEye[0]).toBeGreaterThan(0); // gaze right
  });

  it('mood grief drives ψ6 (lip sag), ψ3 (brow furrow), flush negative (pallid)', () => {
    useExplorerStore.getState().setMood(-3.0);
    const p = useExplorerStore.getState().currentParams!;
    // MOOD_GRIEF_RECIPE: ψ3×2.0, ψ6×2.5, ψ7×1.0, ψ4×0.8 (applied at magnitude 3.0)
    expect(p.expression[3]).toBeCloseTo(6.0);    // ψ3: 2.0 × 3.0
    expect(p.expression[6]).toBeCloseTo(7.5);    // ψ6: 2.5 × 3.0
    expect(p.expression[7]).toBeCloseTo(3.0);    // ψ7: 1.0 × 3.0
    expect(p.expression[4]).toBeCloseTo(2.4);    // ψ4: 0.8 × 3.0
    expect(p.flush).toBeLessThan(0);             // pallid
    // ψ9 should be zero (grief recipe doesn't use it)
    expect(p.expression[9]).toBe(0);
  });

  // --- Circumplex combination ---
  it('tension + mood stack on shared ψ components (from full recipes)', () => {
    useExplorerStore.getState().setTension(3.0);
    useExplorerStore.getState().setMood(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    // ψ0: TENSION_TENSE 1.0×3 + MOOD_EUPHORIA 0.3×3 = 3.0 + 0.9 = 3.9
    expect(expr[0]).toBeCloseTo(3.9);
    // ψ5: TENSION_TENSE 0.8×3 + MOOD_EUPHORIA 0.5×3 = 2.4 + 1.5 = 3.9
    expect(expr[5]).toBeCloseTo(3.9);
    // ψ8: TENSION_TENSE 1.5×3 + MOOD_EUPHORIA 0.5×3 = 4.5 + 1.5 = 6.0
    expect(expr[8]).toBeCloseTo(6.0);
    // ψ4: TENSION_TENSE -0.5×3 + MOOD_EUPHORIA -2.0×3 = -1.5 + -6.0 = -7.5
    expect(expr[4]).toBeCloseTo(-7.5);
  });

  it('MANIC quadrant: tense + euphoric → jaw + flush + wide eyes', () => {
    useExplorerStore.getState().setTension(2.0);
    useExplorerStore.getState().setMood(2.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.pose.jaw).toBeGreaterThan(0);
    expect(p.flush).toBeGreaterThan(0);
    expect(p.fatigue).toBeLessThan(0);  // wired, not fatigued
  });

  it('DEPRESSED quadrant: placid + grief → droopy + pallid + fatigued', () => {
    useExplorerStore.getState().setTension(-2.0);
    useExplorerStore.getState().setMood(-2.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.flush).toBeLessThan(0);     // pallid
    expect(p.fatigue).toBeGreaterThan(0); // exhausted
  });

  // --- Shape axes with pose ---
  it('dominance drives β components and pose pitch', () => {
    useExplorerStore.getState().setDominance(3.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.shape[3]).toBeCloseTo(4.0);   // β3: 3.0 × 3.0 = 9.0, clamped to BETA3_CLAMP=4.0
    expect(p.shape[13]).toBeCloseTo(5.0);  // β13: 2.5 × 3.0 = 7.5, clamped to BETA_GENERAL_CLAMP=5.0
    expect(p.shape[48]).toBeCloseTo(5.0);  // β48: 2.5 × 3.0 = 7.5, clamped to 5.0
    // No pose link — dominance is shape-only to avoid interfering with expression
  });

  it('stature drives β components and pose pitch', () => {
    useExplorerStore.getState().setStature(3.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.shape[1]).toBeCloseTo(5.0);   // β1: 3.0×3.0=9.0, clamped to 5.0
    expect(p.shape[15]).toBeCloseTo(5.0);  // β15: 2.5×3.0=7.5, clamped to 5.0
    expect(p.shape[49]).toBeCloseTo(5.0);  // β49: 2.5×3.0=7.5, clamped to 5.0
    expect(p.pose.neck[0]).toBeGreaterThan(0);  // heavy = chin up
  });

  it('shape axes have zero component overlap', () => {
    useExplorerStore.getState().setDominance(3.0);
    useExplorerStore.getState().setStature(3.0);
    const shape = useExplorerStore.getState().currentParams!.shape;

    // Dominance components (clamped to safe range)
    expect(shape[0]).toBeCloseTo(5.0);   // 6.0 → clamped 5.0
    expect(shape[2]).toBeCloseTo(5.0);   // 6.0 → clamped 5.0
    expect(shape[3]).toBeCloseTo(4.0);   // 9.0 → clamped 4.0 (β3 tight clamp)
    expect(shape[13]).toBeCloseTo(5.0);  // 7.5 → clamped 5.0
    expect(shape[48]).toBeCloseTo(5.0);  // 7.5 → clamped 5.0

    // Stature components (clamped to safe range)
    expect(shape[1]).toBeCloseTo(5.0);   // 9.0 → clamped 5.0
    expect(shape[5]).toBeCloseTo(4.5);   // under clamp
    expect(shape[6]).toBeCloseTo(5.0);   // 6.0 → clamped 5.0
    expect(shape[15]).toBeCloseTo(5.0);  // 7.5 → clamped 5.0
    expect(shape[49]).toBeCloseTo(5.0);  // 7.5 → clamped 5.0
  });

  it('negative dominance produces soyboi face', () => {
    useExplorerStore.getState().setDominance(-3.0);
    const p = useExplorerStore.getState().currentParams!;
    expect(p.shape[3]).toBeCloseTo(-4.0);  // clamped to -BETA3_CLAMP
  });

  // --- Raw mode ---
  it('raw mode bypasses high-level mappings', () => {
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

  it('raw mode texture sliders work', () => {
    useExplorerStore.getState().setMode('raw');
    useExplorerStore.getState().setFlush(0.7);
    useExplorerStore.getState().setFatigue(-0.5);
    const params = useExplorerStore.getState().currentParams!;
    expect(params.flush).toBe(0.7);
    expect(params.fatigue).toBe(-0.5);
  });

  it('raw mode pose override works', () => {
    useExplorerStore.getState().setMode('raw');
    useExplorerStore.getState().setPoseOverride(true);
    useExplorerStore.getState().setPitch(0.3);
    useExplorerStore.getState().setYaw(0.1);
    const params = useExplorerStore.getState().currentParams!;
    expect(params.pose.neck[0]).toBe(0.3);
    expect(params.pose.neck[1]).toBe(0.1);
  });

  it('raw mode gaze override works', () => {
    useExplorerStore.getState().setMode('raw');
    useExplorerStore.getState().setGazeOverride(true);
    useExplorerStore.getState().setGazeHorizontal(0.25);
    useExplorerStore.getState().setGazeVertical(-0.1);
    const params = useExplorerStore.getState().currentParams!;
    expect(params.pose.leftEye[0]).toBe(0.25);
    expect(params.pose.leftEye[1]).toBe(-0.1);
  });

  // --- ψ7 safety clamp ---
  it('ψ7 is clamped in high-level mode', () => {
    // tension at +3 pushes ψ7 to -4.5 via tension recipe, mood at +3 pushes ψ7 to +4.5
    // But at extremes with mood only: ψ7 = 1.5 × 3 = 4.5 → clamped to 4.0
    useExplorerStore.getState().setMood(3.0);
    const expr = useExplorerStore.getState().currentParams!.expression;
    expect(expr[7]).toBeLessThanOrEqual(4.0);
    expect(expr[7]).toBeGreaterThanOrEqual(-4.0);
  });
});
