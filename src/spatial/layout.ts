import type { TickerConfig, LayoutStrategy, LayoutResult } from '../types';

/**
 * Compute 3D positions for faces given a layout strategy.
 */
export function computeLayout(
  _tickers: TickerConfig[],
  _strategy: LayoutStrategy,
): LayoutResult {
  throw new Error('Not implemented — see spatial worktree');
}
