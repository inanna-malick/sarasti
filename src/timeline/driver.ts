import type {
  TimelineDataset,
  FaceInstance,
  FaceRenderer,
  Frame,
} from '../types';
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

  constructor(dataset: TimelineDataset, renderer: FaceRenderer) {
    this.dataset = dataset;
    this.renderer = renderer;

    // Compute initial layout
    const store = useStore.getState();
    const layout = computeLayout(dataset.tickers, store.layout);
    this.positions = layout.positions;

    // Create engine
    this.engine = new TimelineEngine(dataset.frames.length);
    useStore.getState().setFrameCount(dataset.frames.length);

    // Listen for frame changes
    this.engine.onFrameChange((index) => this.renderFrame(index));

    // Render initial frame
    this.renderFrame(0);
  }

  /** Build FaceInstance[] from a frame and current positions. */
  private buildInstances(frame: Frame): FaceInstance[] {
    const instances: FaceInstance[] = [];
    for (const ticker of this.dataset.tickers) {
      const tickerFrame = frame.values[ticker.id];
      if (!tickerFrame) continue;
      const pos = this.positions.get(ticker.id);
      if (!pos) continue;

      instances.push({
        id: ticker.id,
        params: this.resolver.resolve(ticker, tickerFrame),
        position: pos,
        ticker,
        frame: tickerFrame,
      });
    }
    return instances;
  }

  /** Render a single frame by index. */
  private renderFrame(index: number): void {
    const frame = getFrame(this.dataset, index);
    const instances = this.buildInstances(frame);

    this.renderer.setInstances(instances);

    // Sync to store
    const store = useStore.getState();
    store.setCurrentIndex(index);
    store.setCurrentTimestamp(frame.timestamp);
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
    this.renderFrame(this.engine.state.current_index);
  }

  get currentEngine(): TimelineEngine {
    return this.engine;
  }

  dispose(): void {
    this.engine.dispose();
  }
}
