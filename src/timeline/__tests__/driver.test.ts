import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FrameDriver } from '../driver';
import { useStore } from '../../store';
import type { TimelineDataset, FaceRenderer, FaceInstance, TickerConfig, Frame } from '../../types';

// Mock data
const mockTickers: TickerConfig[] = [
  { id: 'T1', name: 'Ticker 1', class: 'energy', family: 'F1', age: 10 },
  { id: 'T2', name: 'Ticker 2', class: 'fear', family: 'F2', age: 20 },
];

const mockFrames: Frame[] = [
  {
    timestamp: '2026-01-01T00:00:00Z',
    values: {
      T1: { close: 100, volume: 1000, deviation: 0.1, velocity: 0.5, volatility: 0.2, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 },
      T2: { close: 200, volume: 2000, deviation: 0.2, velocity: 0.6, volatility: 0.3, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 },
    },
  },
  {
    timestamp: '2026-01-01T01:00:00Z',
    values: {
      T1: { close: 101, volume: 1100, deviation: 0.11, velocity: 0.51, volatility: 0.21, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 },
      T2: { close: 201, volume: 2100, deviation: 0.21, velocity: 0.61, volatility: 0.31, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 },
    },
  },
];

const mockDataset: TimelineDataset = {
  tickers: mockTickers,
  frames: mockFrames,
  timestamps: mockFrames.map(f => f.timestamp),
  baseline_timestamp: mockFrames[0].timestamp,
};

describe('FrameDriver', () => {
  let renderer: FaceRenderer;
  let driver: FrameDriver;

  beforeEach(() => {
    vi.useFakeTimers();
    let now = 0;
    vi.stubGlobal('performance', { now: () => now });
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16));
    vi.stubGlobal('cancelAnimationFrame', (id: any) => clearTimeout(id));

    renderer = {
      init: vi.fn().mockResolvedValue(undefined),
      setInstances: vi.fn(),
      highlightInstance: vi.fn(),
      selectInstance: vi.fn(),
      getInstanceAtScreenPos: vi.fn(),
      setCameraTarget: vi.fn(),
      dispose: vi.fn(),
    };

    // Reset store state
    useStore.setState({
      playback: { current_index: 0, playing: false, speed: 1, loop: true },
      frameCount: 0,
      dataset: null,
      hoveredId: null,
      selectedId: null,
      showLanding: true,
      currentTimestamp: '',
      instances: [],
    });

    driver = new FrameDriver(mockDataset, renderer);
  });

  afterEach(() => {
    driver.dispose();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes and renders the first frame', () => {
    expect(renderer.setInstances).toHaveBeenCalled();
    const instances = (renderer.setInstances as any).mock.calls[0][0] as FaceInstance[];
    expect(instances.length).toBe(2);
    expect(instances[0].id).toBe('T1');
    expect(instances[1].id).toBe('T2');

    const state = useStore.getState();
    expect(state.frameCount).toBe(2);
    expect(state.playback.current_index).toBe(0);
    expect(state.currentTimestamp).toBe(mockFrames[0].timestamp);
    expect(state.instances).toHaveLength(2);
  });

  it('play() starts the engine and updates store', () => {
    driver.play();
    expect(useStore.getState().playback.playing).toBe(true);
    expect(driver.currentEngine.state.playing).toBe(true);
  });

  it('pause() stops the engine and updates store', () => {
    driver.play();
    driver.pause();
    expect(useStore.getState().playback.playing).toBe(false);
    expect(driver.currentEngine.state.playing).toBe(false);
  });

  it('seek() updates renderer and store', () => {
    driver.seek(1);
    expect(useStore.getState().playback.current_index).toBe(1);
    expect(useStore.getState().currentTimestamp).toBe(mockFrames[1].timestamp);
    expect(renderer.setInstances).toHaveBeenCalledTimes(2); // init (0) + seek (1)
  });

  it('setSpeed() updates engine and store', () => {
    driver.setSpeed(2);
    expect(useStore.getState().playback.speed).toBe(2);
    expect(driver.currentEngine.state.speed).toBe(2);
  });

  it('setLoop() updates engine and store', () => {
    driver.setLoop(false);
    expect(useStore.getState().playback.loop).toBe(false);
    expect(driver.currentEngine.state.loop).toBe(false);
  });

  it('updates automatically when playing', () => {
    driver.setSpeed(1); // 1s per frame
    driver.play();
    
    vi.advanceTimersByTime(1000);
    // Note: TimelineEngine uses performance.now() which we need to advance if we didn't use vi.advanceTimersByTime correctly
    // My engine.test.ts used (global as any).advanceTime = (ms: number) => { now += ms; vi.advanceTimersByTime(ms); };
    // Let's manually advance performance.now too.
    
    // Actually let's redefine advanceTime here or just do it manually.
    const advanceTime = (ms: number) => {
      const currentNow = (performance.now as any)();
      vi.stubGlobal('performance', { now: () => currentNow + ms });
      vi.advanceTimersByTime(ms);
    };

    advanceTime(1000);
    
    expect(useStore.getState().playback.current_index).toBe(1);
    expect(useStore.getState().currentTimestamp).toBe(mockFrames[1].timestamp);
  });

  it('lerpParams with missing pose returns valid FaceParams without throwing', () => {
    // Construct two FaceParams objects where pose is undefined
    // Use real dimensions from src/constants
    const a = {
      shape: new Float32Array(100),
      expression: new Float32Array(100),
      flush: 0,
      fatigue: 0
    } as any;
    const b = {
      shape: new Float32Array(100),
      expression: new Float32Array(100),
      flush: 0,
      fatigue: 0
    } as any;

    const out = {
      shape: new Float32Array(100),
      expression: new Float32Array(100),
      pose: { neck: [0, 0, 0], jaw: 0, leftEye: [0, 0], rightEye: [0, 0] },
      flush: 0,
      fatigue: 0
    };

    // Call lerpParams(a, b, 0.5, out)
    // This should NOT throw even if a.pose/b.pose are missing
    expect(() => (driver as any).lerpParams(a, b, 0.5, out)).not.toThrow();
    expect(out.pose).toBeDefined();
  });
});
