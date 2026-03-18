import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { useExplorerStore } from '@/explorer/store';
import { N_SHAPE, N_EXPR } from '@/constants';
import { initDirectionTablesSync } from '@/binding/directions';

describe('Explorer Store', () => {
  beforeAll(() => {
    // Mock direction tables for shape/expression resolve
    const mockTable = (axis: string, space: 'shape' | 'expression'): any => ({
      axis,
      space,
      dims: space === 'shape' ? N_SHAPE : N_EXPR,
      points: [
        { t: -3, params: new Array(space === 'shape' ? N_SHAPE : N_EXPR).fill(0).map((_, i) => i === 0 ? -1 : 0) },
        { t: 3, params: new Array(space === 'shape' ? N_SHAPE : N_EXPR).fill(0).map((_, i) => i === 0 ? 1 : 0) },
      ],
    });

    const tables = {
      age: mockTable('age', 'shape'),
      build: mockTable('build', 'shape'),
      valence: mockTable('valence', 'expression'),
      aperture: mockTable('aperture', 'expression'),
    };

    const identity = {
      dims: N_SHAPE,
      n_basis: 1,
      vectors: [new Array(N_SHAPE).fill(0)],
    };

    initDirectionTablesSync(tables, identity);
  });

  beforeEach(() => {
    // Reset store to defaults before each test
    useExplorerStore.setState({
      mode: 'highlevel',
      age: 30,
      assetClass: 'energy',
      family: 'brent',
      deviation: 0,
      velocity: 0,
      volatility: 1.0,
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
      rawShape: new Float32Array(N_SHAPE),
      rawExpression: new Float32Array(N_EXPR),
    });

    useExplorerStore.getState().recompute();
  });

  it('Default state produces valid FaceParams after recompute()', () => {
    const { currentParams, currentReport } = useExplorerStore.getState();

    expect(currentParams).not.toBeNull();
    expect(currentParams?.shape.length).toBe(N_SHAPE);
    expect(currentParams?.expression.length).toBe(N_EXPR);
    expect(currentReport).not.toBeNull();
    expect(currentReport?.tickerId).toBe('explorer');
  });

  it('Changing deviation produces different expression coefficients', () => {
    const { setDeviation } = useExplorerStore.getState();

    setDeviation(0);
    const expr0 = new Float32Array(useExplorerStore.getState().currentParams!.expression);

    setDeviation(0.2);
    const expr1 = new Float32Array(useExplorerStore.getState().currentParams!.expression);

    expect(expr1).not.toEqual(expr0);
  });

  it('Changing age produces different shape coefficients', () => {
    const { setAge } = useExplorerStore.getState();

    setAge(30);
    const shape30 = new Float32Array(useExplorerStore.getState().currentParams!.shape);

    setAge(60);
    const shape60 = new Float32Array(useExplorerStore.getState().currentParams!.shape);

    expect(shape60).not.toEqual(shape30);
  });

  it('Raw mode bypasses binding pipeline and nullifies report', () => {
    const { setMode, setRawShape, setRawExpression } = useExplorerStore.getState();

    setMode('raw');
    setRawShape(0, 1.5);
    setRawExpression(0, 2.5);

    const { currentParams, currentReport } = useExplorerStore.getState();

    expect(currentReport).toBeNull();
    expect(currentParams?.shape[0]).toBe(1.5);
    expect(currentParams?.expression[0]).toBe(2.5);
    expect(currentParams?.shape[1]).toBe(0);
    expect(currentParams?.expression[1]).toBe(0);
  });

  it('Pose override replaces pose values and nullifies report', () => {
    const { setPoseOverride, setPitch, setYaw, setRoll, setJaw } = useExplorerStore.getState();

    setPoseOverride(true);
    setPitch(0.1);
    setYaw(0.2);
    setRoll(0.1);
    setJaw(0.4);

    const { currentParams, currentReport } = useExplorerStore.getState();
    expect(currentParams?.pose.neck).toEqual([0.1, 0.2, 0.1]);
    expect(currentParams?.pose.jaw).toBe(0.4);
    expect(currentReport).toBeNull();
  });

  it('Gaze override replaces gaze values and nullifies report', () => {
    const { setGazeOverride, setGazeHorizontal, setGazeVertical } = useExplorerStore.getState();

    setGazeOverride(true);
    setGazeHorizontal(0.5);
    setGazeVertical(0.3);

    const { currentParams, currentReport } = useExplorerStore.getState();
    expect(currentParams?.pose.leftEye).toEqual([0.5, 0.3]);
    expect(currentParams?.pose.rightEye).toEqual([0.5, 0.3]);
    expect(currentReport).toBeNull();
  });

  it('Flush and fatigue overrides are applied', () => {
    const { setFlush, setFatigue } = useExplorerStore.getState();

    setFlush(0.8);
    setFatigue(-0.5);

    const { currentParams } = useExplorerStore.getState();
    expect(currentParams?.flush).toBe(0.8);
    expect(currentParams?.fatigue).toBe(-0.5);
  });

  it('Inputs are clamped to valid ranges', () => {
    const { setAge, setDeviation, setPitch, setFlush } = useExplorerStore.getState();

    setAge(100); // Max 60
    expect(useExplorerStore.getState().age).toBe(60);

    setDeviation(-1.0); // Min -0.2
    expect(useExplorerStore.getState().deviation).toBe(-0.2);

    setPitch(2.0); // Max MAX_NECK_PITCH (0.537)
    expect(useExplorerStore.getState().pitch).toBeCloseTo(0.537, 3);

    setFlush(-5.0); // Min -1
    expect(useExplorerStore.getState().flush).toBe(-1);
  });
});
