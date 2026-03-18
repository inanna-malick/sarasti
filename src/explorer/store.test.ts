import { describe, it, expect, beforeEach } from 'vitest';
import { useExplorerStore } from './store';

// Reset store between tests — volatility=1 is neutral (pose/gaze use vol-1.0)
beforeEach(() => {
  useExplorerStore.setState({
    mode: 'highlevel',
    age: 30,
    assetClass: 'energy',
    family: 'brent',
    deviation: 0,
    velocity: 0,
    volatility: 1,
    poseOverride: false,
    pitch: 0,
    yaw: 0,
    roll: 0,
    jaw: 0,
    gazeOverride: false,
    gazeHorizontal: 0,
    gazeVertical: 0,
    flush: 0,
    fatigue: 0,
    rawShape: new Float32Array(100),
    rawExpression: new Float32Array(100),
    currentParams: null,
    currentReport: null,
  });
});

describe('ExplorerStore', () => {
  it('produces valid FaceParams after recompute()', () => {
    useExplorerStore.getState().recompute();
    const { currentParams } = useExplorerStore.getState();
    expect(currentParams).not.toBeNull();
    expect(currentParams!.shape).toBeInstanceOf(Float32Array);
    expect(currentParams!.expression).toBeInstanceOf(Float32Array);
    expect(currentParams!.shape.length).toBe(100);
    expect(currentParams!.expression.length).toBe(100);
    expect(currentParams!.pose).toBeDefined();
    expect(currentParams!.pose.neck).toHaveLength(3);
  });

  it('changing deviation produces different expression coefficients', () => {
    useExplorerStore.getState().recompute();
    const baseline = new Float32Array(useExplorerStore.getState().currentParams!.expression);

    useExplorerStore.getState().setDeviation(0.15);
    const changed = useExplorerStore.getState().currentParams!.expression;

    let differs = false;
    for (let i = 0; i < baseline.length; i++) {
      if (baseline[i] !== changed[i]) { differs = true; break; }
    }
    expect(differs).toBe(true);
  });

  it('shape resolver produces Float32Array of correct length', () => {
    useExplorerStore.getState().recompute();
    const params = useExplorerStore.getState().currentParams!;
    expect(params.shape).toBeInstanceOf(Float32Array);
    expect(params.shape.length).toBe(100);

    // Switch to raw mode and verify shape comes from raw sliders
    useExplorerStore.getState().setMode('raw');
    useExplorerStore.getState().setRawShape(5, 2.0);
    const rawParams = useExplorerStore.getState().currentParams!;
    expect(rawParams.shape[5]).toBe(2.0);
    expect(rawParams.shape[0]).toBe(0);
  });

  it('raw mode bypasses binding pipeline', () => {
    useExplorerStore.getState().setMode('raw');
    const state = useExplorerStore.getState();
    expect(state.currentReport).toBeNull();
    expect(state.currentParams).not.toBeNull();
    const allZero = state.currentParams!.shape.every(v => v === 0);
    expect(allZero).toBe(true);
  });

  it('raw mode uses raw slider values directly', () => {
    useExplorerStore.getState().setMode('raw');
    useExplorerStore.getState().setRawShape(0, 3.5);
    const params = useExplorerStore.getState().currentParams!;
    expect(params.shape[0]).toBe(3.5);
  });

  it('raw mode uses texture slider values', () => {
    useExplorerStore.getState().setMode('raw');
    useExplorerStore.getState().setFlush(0.5);
    useExplorerStore.getState().setFatigue(-0.3);
    const params = useExplorerStore.getState().currentParams!;
    expect(params.flush).toBe(0.5);
    expect(params.fatigue).toBe(-0.3);
  });

  it('pose override replaces pose values', () => {
    useExplorerStore.getState().recompute();
    useExplorerStore.getState().setPoseOverride(true);
    useExplorerStore.getState().setPitch(0.3);
    useExplorerStore.getState().setYaw(0.1);

    const params = useExplorerStore.getState().currentParams!;
    expect(params.pose.neck[0]).toBe(0.3);
    expect(params.pose.neck[1]).toBe(0.1);
  });

  it('gaze override replaces gaze values', () => {
    useExplorerStore.getState().recompute();
    useExplorerStore.getState().setGazeOverride(true);
    useExplorerStore.getState().setGazeHorizontal(0.25);
    useExplorerStore.getState().setGazeVertical(-0.1);

    const params = useExplorerStore.getState().currentParams!;
    expect(params.pose.leftEye[0]).toBe(0.25);
    expect(params.pose.leftEye[1]).toBe(-0.1);
    expect(params.pose.rightEye[0]).toBe(0.25);
    expect(params.pose.rightEye[1]).toBe(-0.1);
  });

  it('high-level mode produces a BindingReport', () => {
    useExplorerStore.getState().setDeviation(0.1);
    const { currentReport } = useExplorerStore.getState();
    expect(currentReport).not.toBeNull();
    expect(currentReport!.tickerId).toBe('explorer');
    expect(currentReport!.shape).toBeInstanceOf(Array);
    expect(currentReport!.expression).toBeInstanceOf(Array);
  });

  it('texture sliders override flush and fatigue', () => {
    useExplorerStore.getState().setFlush(0.7);
    useExplorerStore.getState().setFatigue(-0.5);
    const params = useExplorerStore.getState().currentParams!;
    expect(params.flush).toBe(0.7);
    expect(params.fatigue).toBe(-0.5);
  });

  it('report reflects manual texture overrides', () => {
    useExplorerStore.getState().setFlush(0.8);
    const { currentReport, currentParams } = useExplorerStore.getState();
    expect(currentReport).not.toBeNull();
    expect(currentReport!.flush.value).toBe(currentParams!.flush);
    expect(currentReport!.flush.contributions[0].source).toBe('manual');
  });

  it('report reflects pose override when enabled', () => {
    useExplorerStore.getState().setPoseOverride(true);
    useExplorerStore.getState().setPitch(0.2);
    const { currentReport, currentParams } = useExplorerStore.getState();
    expect(currentReport).not.toBeNull();
    expect(currentReport!.pose.pitch.value).toBe(currentParams!.pose.neck[0]);
    expect(currentReport!.pose.pitch.contributions[0].source).toBe('manual');
  });

  it('report reflects gaze override when enabled', () => {
    useExplorerStore.getState().setGazeOverride(true);
    useExplorerStore.getState().setGazeHorizontal(0.3);
    const { currentReport, currentParams } = useExplorerStore.getState();
    expect(currentReport).not.toBeNull();
    expect(currentReport!.gaze.horizontal.value).toBe(currentParams!.pose.leftEye[0]);
    expect(currentReport!.gaze.horizontal.contributions[0].source).toBe('manual');
  });
});
