import type { TickerConfig, LayoutStrategy, LayoutResult, AssetClass } from '../types';
import { FACE_SPACING } from '../constants';

const FACE_RADIUS = 1.0;
const SPACING = FACE_SPACING * FACE_RADIUS;

export function computeLayout(tickers: TickerConfig[], strategy: LayoutStrategy): LayoutResult {
  const positions = new Map<string, [number, number, number]>();

  // All strategies produce an X×Y grid — they differ only in sort order.
  let sorted: TickerConfig[];
  switch (strategy.kind) {
    case 'family-rows':
      sorted = sortByClassThenFamily(tickers);
      break;
    case 'class-clusters':
      sorted = sortByClass(tickers);
      break;
    case 'reactivity-sweep':
      sorted = [...tickers].sort((a, b) => a.age - b.age);
      break;
    default: {
      const exhaustiveCheck: never = strategy;
      throw new Error(`Unhandled strategy kind: ${(exhaustiveCheck as any).kind}`);
    }
  }

  placeGrid(sorted, positions);
  return { positions };
}

/** Place tickers in a rectangular grid, centered at origin. */
function placeGrid(tickers: TickerConfig[], positions: Map<string, [number, number, number]>): void {
  if (tickers.length === 0) return;

  // Pick columns to make a roughly square grid, slightly wider than tall
  const cols = Math.ceil(Math.sqrt(tickers.length * 1.5));
  const rows = Math.ceil(tickers.length / cols);

  const gridW = (cols - 1) * SPACING;
  const gridH = (rows - 1) * SPACING;

  tickers.forEach((ticker, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = -gridW / 2 + col * SPACING;
    const y = gridH / 2 - row * SPACING;
    positions.set(ticker.id, [x, y, 0]);
  });
}

/** Sort by asset class, then by family, then by age within family. */
function sortByClassThenFamily(tickers: TickerConfig[]): TickerConfig[] {
  const classOrder: AssetClass[] = ['energy', 'fear', 'currency', 'equity', 'media'];
  return [...tickers].sort((a, b) => {
    const ca = classOrder.indexOf(a.class);
    const cb = classOrder.indexOf(b.class);
    if (ca !== cb) return ca - cb;
    if (a.family !== b.family) return a.family.localeCompare(b.family);
    return a.age - b.age;
  });
}

/** Sort by asset class, then by age. */
function sortByClass(tickers: TickerConfig[]): TickerConfig[] {
  const classOrder: AssetClass[] = ['energy', 'fear', 'currency', 'equity', 'media'];
  return [...tickers].sort((a, b) => {
    const ca = classOrder.indexOf(a.class);
    const cb = classOrder.indexOf(b.class);
    if (ca !== cb) return ca - cb;
    return a.age - b.age;
  });
}
