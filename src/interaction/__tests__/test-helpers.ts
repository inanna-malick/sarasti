import type { FaceInstance, TickerConfig, TickerFrame } from '../../types';
import { zeroPose } from '../../types';

export function makeFaceInstance(id: string, overrides: Partial<FaceInstance> = {}): FaceInstance {
  const ticker: TickerConfig = {
    id,
    name: `Ticker ${id}`,
    class: 'energy',
    family: 'test-family',
    age: 25,
    ...overrides.ticker,
  };

  const frame: TickerFrame = {
    close: 100,
    volume: 1000,
    deviation: 0.1,
    velocity: 0.05,
    volatility: 1.2,
    drawdown: 0,
    momentum: 0,
    mean_reversion_z: 0,
    beta: 1,
    ...overrides.frame,
  };

  return {
    id,
    ticker,
    frame,
    position: [0, 0, 0],
    params: {
      shape: new Float32Array(100),
      expression: new Float32Array(100),
      pose: zeroPose(),
      flush: 0,
      fatigue: 0,
    },
    ...overrides,
  };
}
