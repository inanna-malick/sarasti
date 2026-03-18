import type { LayoutResult } from '../types';
import { FACE_SPACING } from '../constants';

const FACE_RADIUS = 1.0;
const SPACING = FACE_SPACING * FACE_RADIUS;
const DEFAULT_ASPECT = 16 / 9;

// ─── Generic grid layout (library API) ──────────────

export interface GridLayoutOptions {
  cols?: number;
  spacing?: number;
  aspect?: number;
}

/**
 * Generic grid layout for any items with id and optional position.
 * Items with position → use it directly.
 * Items without position → auto-arrange in a grid.
 */
export function gridLayout(
  items: { id: string; position?: [number, number, number] }[],
  options?: GridLayoutOptions,
): LayoutResult {
  const positions = new Map<string, [number, number, number]>();
  const spacing = options?.spacing ?? SPACING;
  const aspect = options?.aspect ?? DEFAULT_ASPECT;

  // Separate items with explicit positions from those needing auto-layout
  const needsLayout: { id: string }[] = [];

  for (const item of items) {
    if (item.position) {
      positions.set(item.id, item.position);
    } else {
      needsLayout.push(item);
    }
  }

  // Auto-layout the rest in a grid
  if (needsLayout.length > 0) {
    const n = needsLayout.length;
    const cols = options?.cols ?? chooseGridCols(n, aspect);
    const rows = Math.ceil(n / cols);
    const gridH = (rows - 1) * spacing;

    needsLayout.forEach((item, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const itemsInRow = row < rows - 1 ? cols : n - row * cols;
      const rowW = (itemsInRow - 1) * spacing;
      const xOffset = -rowW / 2;

      const x = xOffset + col * spacing;
      const y = gridH / 2 - row * spacing;
      positions.set(item.id, [x, y, 0]);
    });
  }

  return { positions };
}

/**
 * Choose optimal column count for n items at given aspect ratio.
 */
function chooseGridCols(n: number, aspect: number): number {
  if (n <= 1) return 1;

  let bestCols = Math.round(Math.sqrt(n * aspect));
  bestCols = Math.max(1, Math.min(n, bestCols));

  let bestScore = Infinity;
  let finalCols = bestCols;

  for (let c = Math.max(1, bestCols - 2); c <= Math.min(n, bestCols + 2); c++) {
    const r = Math.ceil(n / c);
    const gridAspect = r <= 1 ? aspect : (c - 1) / (r - 1);
    const score = Math.abs(Math.log(gridAspect / aspect));
    if (score < bestScore || (score === bestScore && c * r < finalCols * Math.ceil(n / finalCols))) {
      bestScore = score;
      finalCols = c;
    }
  }

  return finalCols;
}

// ─── Hormuz compat wrapper ──────────────────────────

/** Threat-proximity order (hormuz-specific) */
type AssetClass = 'energy' | 'commodity' | 'fear' | 'currency' | 'equity' | 'media';
const CLASS_ORDER: AssetClass[] = ['energy', 'commodity', 'fear', 'currency', 'equity', 'media'];

interface TickerConfigLike {
  id: string;
  class: string;
  age: number;
}

/**
 * Legacy layout: sorts by threat-proximity, then grids.
 * @deprecated Use gridLayout() for new code.
 */
export function computeLayout(tickers: TickerConfigLike[], aspect: number = DEFAULT_ASPECT): LayoutResult {
  const sorted = [...tickers].sort((a, b) => {
    const ca = CLASS_ORDER.indexOf(a.class as AssetClass);
    const cb = CLASS_ORDER.indexOf(b.class as AssetClass);
    if (ca !== cb) return (ca === -1 ? Infinity : ca) - (cb === -1 ? Infinity : cb);
    return a.age - b.age;
  });
  return gridLayout(sorted, { aspect });
}
