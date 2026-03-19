import type { FaceDatum, FaceFrame, FaceParams, FaceRenderer, GenericFaceInstance } from './types';
import type { AxesConfig, AxisCurveConfig, ResponseCurve } from './binding/types';
import { resolveFromAxes, AxisValues } from './binding/resolve';
import { DEFAULT_AXIS_CURVES } from './binding/config';
import { applyCurve, applySymmetricCurve } from './binding/curves';
import { gridLayout } from './spatial/layout';
import { createFlameSceneRenderer } from './renderer';

export interface SarastiOptions {
  speed?: number;
  loop?: boolean;
  cols?: number;
  spacing?: number;
  assetsBasePath?: string;
}

export function sarasti(container: string | HTMLElement): SarastiBuilder {
  return new SarastiBuilder(container);
}

export class SarastiBuilder<T extends FaceDatum = FaceDatum> {
  private _container: string | HTMLElement;
  private _data: T[] = [];
  private _axes: AxesConfig<T> = {};
  private _curves: Partial<AxisCurveConfig> = {};
  private _frames: FaceFrame<T>[] = [];
  private _playbackConfig: { speed?: number; loop?: boolean } = {};
  private _layoutConfig: { cols?: number; spacing?: number } = {};
  private _assetsBasePath: string = '/data/';
  private _renderer: FaceRenderer | null = null;
  private _instances: GenericFaceInstance<T>[] = [];
  private _disposed = false;

  constructor(container: string | HTMLElement) {
    this._container = container;
  }

  data(items: T[]): this {
    this._data = items;
    return this;
  }

  axes(config: AxesConfig<T>): this {
    this._axes = config;
    return this;
  }

  curves(config: Partial<AxisCurveConfig>): this {
    this._curves = config;
    return this;
  }

  frames(frames: FaceFrame<T>[]): this {
    this._frames = frames;
    return this;
  }

  playback(config: { speed?: number; loop?: boolean }): this {
    this._playbackConfig = config;
    return this;
  }

  layout(config: { cols?: number; spacing?: number }): this {
    this._layoutConfig = config;
    return this;
  }

  assets(basePath: string): this {
    this._assetsBasePath = basePath;
    return this;
  }

  get instances(): GenericFaceInstance<T>[] {
    return this._instances;
  }

  /**
   * Resolve a single datum through the axes pipeline → FaceParams.
   * 1. For each configured axis, call the accessor to extract a raw value
   * 2. Apply the response curve (default or custom) to get the axis output
   * 3. Pass all axis outputs to resolveFromAxes() → FaceParams
   */
  private resolveDatum(datum: T): FaceParams {
    const axisValues: AxisValues = {};
    const curves = { ...DEFAULT_AXIS_CURVES, ...this._curves } as Record<string, ResponseCurve>;

    // For each axis in the config, extract value and apply curve
    const axisNames = Object.keys(this._axes) as (keyof AxesConfig<T>)[];
    for (const axisName of axisNames) {
      const accessor = this._axes[axisName];
      if (!accessor) continue;

      const rawValue = accessor(datum);
      const curve = curves[axisName];
      if (curve) {
        // Bipolar axes use symmetric curves
        const bipolar = ['alarm', 'fatigue', 'dominance', 'pitch', 'yaw', 'roll', 'gazeH', 'gazeV', 'flush'];
        const curvedValue = bipolar.includes(axisName)
          ? applySymmetricCurve(curve, rawValue)
          : applyCurve(curve, rawValue);
        (axisValues as any)[axisName] = curvedValue;
      } else {
        (axisValues as any)[axisName] = rawValue;
      }
    }

    return resolveFromAxes(axisValues, datum.id);
  }

  async render(): Promise<this> {
    if (this._disposed) throw new Error('SarastiBuilder has been disposed');

    // Init renderer if needed
    if (!this._renderer) {
      const container = typeof this._container === 'string'
        ? document.querySelector(this._container) as HTMLElement
        : this._container;
      if (!container) throw new Error(`Container not found: ${this._container}`);

      this._renderer = await createFlameSceneRenderer();
      await this._renderer.init(container);
    }

    // Resolve data
    const data = this._frames.length > 0
      ? this._frames[0].data  // static: use first frame
      : this._data;

    // Compute positions
    const layoutItems = data.map(d => ({
      id: d.id,
      position: (d as any).position as [number, number, number] | undefined,
    }));
    const layoutResult = gridLayout(layoutItems, {
      cols: this._layoutConfig.cols,
      spacing: this._layoutConfig.spacing,
    });

    // Build instances
    this._instances = data.map(datum => ({
      id: datum.id,
      params: this.resolveDatum(datum),
      position: layoutResult.positions.get(datum.id) ?? [0, 0, 0],
      datum,
    }));

    // The renderer expects FaceInstance[] but we have GenericFaceInstance[].
    // For now, adapt by providing dummy ticker/frame fields.
    // TODO: Update renderer to accept GenericFaceInstance[] directly
    const rendererInstances = this._instances.map(inst => ({
      id: inst.id,
      params: inst.params,
      position: inst.position,
      ticker: { id: inst.id, name: inst.datum.label ?? inst.id, class: 'equity' as const, family: '', age: 30 },
      frame: { close: 0, volume: 0, deviation: 0, velocity: 0, volatility: 1, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 },
    }));

    this._renderer!.setInstances(rendererInstances);
    return this;
  }

  dispose(): void {
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer = null;
    }
    this._disposed = true;
  }
}
