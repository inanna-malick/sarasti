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
    const { setMode, setAge, setAssetClass, setFamily, setDeviation, setVelocity, setVolatility,
      setPoseOverride, setPitch, setYaw, setRoll, setJaw, setGazeOverride, setGazeHorizontal,
      setGazeVertical, setFlush, setFatigue, setRawShape, setRawExpression } = useExplorerStore.getState();

    setMode('highlevel');
    setAge(30);
    setAssetClass('energy');
    setFamily('brent');
    setDeviation(0);
    setVelocity(0);
    setVolatility(0);
    setPoseOverride(false);
    setPitch(0);
    setYaw(0);
    setRoll(0);
    setJaw(0);
    setGazeOverride(false);
    setGazeHorizontal(0);
    setGazeVertical(0);
    setFlush(0);
    setFatigue(0);

    // Manually reset raw arrays
    const rawShape = useExplorerStore.getState().rawShape;
    for (let i = 0; i < N_SHAPE; i++) rawShape[i] = 0;
    const rawExpr = useExplorerStore.getState().rawExpression;
    for (let i = 0; i < N_EXPR; i++) rawExpr[i] = 0;

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
    const { setDeviation, recompute } = useExplorerStore.getState();

    setDeviation(0);
    recompute();
    const params0 = { ...useExplorerStore.getState().currentParams! };
    const expr0 = new Float32Array(params0.expression);

    setDeviation(0.2);
    recompute();
    const params1 = { ...useExplorerStore.getState().currentParams! };
    const expr1 = new Float32Array(params1.expression);

    expect(expr1).not.toEqual(expr0);
  });

  it('Changing age produces different shape coefficients', () => {
    const { setAge, recompute } = useExplorerStore.getState();

    setAge(30);
    recompute();
    const shape30 = new Float32Array(useExplorerStore.getState().currentParams!.shape);

    setAge(60);
    recompute();
    const shape60 = new Float32Array(useExplorerStore.getState().currentParams!.shape);

    expect(shape60).not.toEqual(shape30);
  });

  it('Raw mode bypasses binding pipeline', () => {
    const { setMode, setRawShape, setRawExpression, recompute } = useExplorerStore.getState();

    setMode('raw');
    setRawShape(0, 1.5);
    setRawExpression(0, 2.5);
    recompute();

    const { currentParams, currentReport } = useExplorerStore.getState();

    expect(currentReport).toBeNull();
    expect(currentParams?.shape[0]).toBe(1.5);
    expect(currentParams?.expression[0]).toBe(2.5);
    // Other values should be zero (except maybe pose if overridden, but it's default)
    expect(currentParams?.shape[1]).toBe(0);
    expect(currentParams?.expression[1]).toBe(0);
  });

  it('Pose override replaces pose values', () => {
    const { setPoseOverride, setPitch, setYaw, setRoll, setJaw, recompute } = useExplorerStore.getState();

    setPoseOverride(true);
    setPitch(0.1);
    setYaw(0.2);
    setRoll(0.3);
    setJaw(0.4);
    recompute();

    const { currentParams } = useExplorerStore.getState();
    expect(currentParams?.pose.neck).toEqual([0.1, 0.2, 0.3]);
    expect(currentParams?.pose.jaw).toBe(0.4);
  });

  it('Gaze override replaces gaze values', () => {
    const { setGazeOverride, setGazeHorizontal, setGazeVertical, recompute } = useExplorerStore.getState();

    setGazeOverride(true);
    setGazeHorizontal(0.5);
    setGazeVertical(0.6);
    recompute();

    const { currentParams } = useExplorerStore.getState();
    expect(currentParams?.pose.leftEye).toEqual([0.5, 0.6]);
    expect(currentParams?.pose.rightEye).toEqual([0.5, 0.6]);
  });
});
