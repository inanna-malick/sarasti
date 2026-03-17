import type { TickerConfig, TickerFrame, FaceParams } from '../types';

/**
 * Unified binding: TickerConfig + TickerFrame → FaceParams.
 * Wires shape (age + identity) and expression (crisis + dynamics) resolvers.
 */
export function resolve(_ticker: TickerConfig, _frame: TickerFrame): FaceParams {
  throw new Error('Not implemented — wired at binding TL integration');
}
