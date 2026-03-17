import type {
  TimelineDataset,
  FaceInstance,
  FaceRenderer,
  FaceParams,
  PoseParams,
  Frame,
} from '../types';
import { zeroPose } from '../types';
import { getFrame } from '../data/loader';
import { createResolver } from '../binding/resolve';
import { computeLayout } from '../spatial/layout';
import { TimelineEngine } from './engine';
import { useStore } from '../store';

/**
 * Bridges timeline engine → data loader → binding → renderer.
 *
 * On each frame change from the engine:
 *   1. getFrame(dataset, index) → Frame
 *   2. For each ticker: resolver.resolve(ticker, frame.values[ticker.id])
 *   3. Combine with layout positions → FaceInstance[]
 *   4. renderer.setInstances(instances)
 *   5. Sync to store (currentTimestamp, currentIndex, instances)
 *
 * The driver owns:
 * - A TimelineEngine (creates it, manages lifecycle)
 * - A binding resolver (creates once, reuses)
 * - Layout computation (recomputes on layout strategy change)
 *
 * The driver does NOT own:
 * - The dataset (passed in, owned by App/store)
 * - The renderer (passed in, owned by App)
 *
 * Usage:
 *   const driver = new FrameDriver(dataset, renderer);
 *   driver.play();
 *   // later:
 *   driver.setLayout({ kind: 'class-clusters' });
 *   driver.dispose();
 */
export class FrameDriver {
  private engine: TimelineEngine;
  private dataset: TimelineDataset;
  private renderer: FaceRenderer;
  private resolver = createResolver();
  private positions: Map<string, [number, number, number]>;

  constructor(dataset: TimelineDataset, renderer: FaceRenderer, initialIndex: number = 0) {
    this.dataset = dataset;
    this.renderer = renderer;

    // Compute initial layout
    const store = useStore.getState();
    const layout = computeLayout(dataset.tickers, store.layout);
    this.positions = layout.positions;

    // Create engine
    this.engine = new TimelineEngine(dataset.frames.length);
    useStore.getState().setFrameCount(dataset.frames.length);

    // Listen for continuous interpolated updates
    this.engine.onContinuous((position) => this.renderInterpolated(position));

    // Seek to initial index and render
    const clamped = Math.max(0, Math.min(initialIndex, dataset.frames.length - 1));
    this.engine.seek(clamped);
    this.renderInterpolated(clamped);
  }

  /** Lerp two FaceParams. Mutates `out` arrays in place for zero-alloc. */
  private lerpParams(a: FaceParams, b: FaceParams, t: number, out: FaceParams): void {
    const s = 1 - t;
    for (let i = 0; i < a.shape.length; i++) {
      out.shape[i] = a.shape[i] * s + b.shape[i] * t;
    }
    for (let i = 0; i < a.expression.length; i++) {
      out.expression[i] = a.expression[i] * s + b.expression[i] * t;
    }
    // Lerp pose params
    const ap = a.pose;
    const bp = b.pose;
    out.pose = {
      neck: [
        ap.neck[0] * s + bp.neck[0] * t,
        ap.neck[1] * s + bp.neck[1] * t,
        ap.neck[2] * s + bp.neck[2] * t,
      ],
      jaw: ap.jaw * s + bp.jaw * t,
      leftEye: [
        ap.leftEye[0] * s + bp.leftEye[0] * t,
        ap.leftEye[1] * s + bp.leftEye[1] * t,
      ],
      rightEye: [
        ap.rightEye[0] * s + bp.rightEye[0] * t,
        ap.rightEye[1] * s + bp.rightEye[1] * t,
      ],
    };
  }

  /** Render at a fractional position, interpolating between adjacent frames. */
  private renderInterpolated(position: number): void {
    const maxIndex = this.dataset.frames.length - 1;
    const indexA = Math.min(Math.floor(position), maxIndex);
    const indexB = Math.min(indexA + 1, maxIndex);
    const t = position - indexA; // fractional part [0, 1)

    const frameA = getFrame(this.dataset, indexA);
    const frameB = indexA === indexB ? frameA : getFrame(this.dataset, indexB);

    const instances: FaceInstance[] = [];
    for (const ticker of this.dataset.tickers) {
      const tickerFrameA = frameA.values[ticker.id];
      const tickerFrameB = frameB.values[ticker.id];
      if (!tickerFrameA) continue;
      const pos = this.positions.get(ticker.id);
      if (!pos) continue;

      const paramsA = this.resolver.resolve(ticker, tickerFrameA);

      let params: FaceParams;
      let tickerFrame = tickerFrameA;
      if (t > 0 && tickerFrameB && indexA !== indexB) {
        const paramsB = this.resolver.resolve(ticker, tickerFrameB);
        // Allocate output buffer for interpolation
        params = { shape: new Float32Array(paramsA.shape.length), expression: new Float32Array(paramsA.expression.length), pose: zeroPose() };
        this.lerpParams(paramsA, paramsB, t, params);
        // Lerp the scalar frame values for crisis intensity etc.
        tickerFrame = {
          ...tickerFrameA,
          close: tickerFrameA.close * (1 - t) + tickerFrameB.close * t,
          deviation: tickerFrameA.deviation * (1 - t) + tickerFrameB.deviation * t,
          velocity: tickerFrameA.velocity * (1 - t) + tickerFrameB.velocity * t,
          volatility: tickerFrameA.volatility * (1 - t) + tickerFrameB.volatility * t,
          volume: tickerFrameA.volume * (1 - t) + tickerFrameB.volume * t,
        };
      } else {
        params = paramsA;
      }

      instances.push({
        id: ticker.id,
        params,
        position: pos,
        ticker,
        frame: tickerFrame,
      });
    }

    this.renderer.setInstances(instances);

    // Sync to store — use the floor index for timeline UI
    const store = useStore.getState();
    store.setCurrentIndex(indexA);
    store.setCurrentTimestamp(frameA.timestamp);
    store.setInstances(instances);
  }

  play(): void {
    this.engine.play();
    useStore.getState().setPlaying(true);
  }

  pause(): void {
    this.engine.pause();
    useStore.getState().setPlaying(false);
  }

  togglePlay(): void {
    if (this.engine.state.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(index: number): void {
    this.engine.seek(index);
  }

  setSpeed(speed: number): void {
    this.engine.setSpeed(speed);
    useStore.getState().setSpeed(speed);
  }

  setLoop(loop: boolean): void {
    this.engine.setLoop(loop);
    useStore.getState().setLoop(loop);
  }

  /** Recompute layout (e.g. when user changes strategy). */
  setLayout(strategy: import('../types').LayoutStrategy): void {
    const layout = computeLayout(this.dataset.tickers, strategy);
    this.positions = layout.positions;
    useStore.getState().setLayout(strategy);
    // Re-render current frame with new positions
    this.renderInterpolated(this.engine.state.current_index);
  }

  get currentEngine(): TimelineEngine {
    return this.engine;
  }

  dispose(): void {
    this.engine.dispose();
  }
}
