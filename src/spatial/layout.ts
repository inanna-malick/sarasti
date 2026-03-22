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

  // Sanitize inputs: ensure finite + >0 values
  const spacing = (options?.spacing !== undefined && Number.isFinite(options.spacing) && options.spacing > 0)
    ? options.spacing
    : SPACING;

  const aspect = (options?.aspect !== undefined && Number.isFinite(options.aspect) && options.aspect > 0)
    ? options.aspect
    : DEFAULT_ASPECT;

  // Separate items with explicit positions from those needing auto-layout
  const needsLayout: { id: string }[] = [];

  for (const item of items) {
    if (item.position) {
      positions.set(item.id, item.position);
    } else {
      needsLayout.push(item);
    }
  }

  // Auto-layout in a hex-packed honeycomb grid
  if (needsLayout.length > 0) {
    const n = needsLayout.length;

    // Sanitize cols: ensure integer in range [1, n]
    let cols = options?.cols ?? chooseGridCols(n, aspect);
    if (!Number.isInteger(cols) || cols < 1) {
      cols = chooseGridCols(n, aspect);
    } else if (cols > n) {
      cols = n;
    }

    const rowStep = spacing * Math.sqrt(3) / 2;

    // Simulate to count total rows
    let totalRows = 0;
    let remaining = n;
    while (remaining > 0) {
      const isOdd = totalRows % 2 === 1;
      const rowSize = isOdd ? cols - 1 : cols;
      remaining -= Math.min(rowSize, remaining);
      totalRows++;
    }

    const totalGridH = (totalRows - 1) * rowStep;

    // Place items row by row
    let idx = 0;
    for (let row = 0; row < totalRows && idx < n; row++) {
      const isOdd = row % 2 === 1;
      const maxInRow = isOdd ? cols - 1 : cols;
      const itemsInRow = Math.min(maxInRow, n - idx);
      const rowW = (itemsInRow - 1) * spacing;
      const xOffset = -rowW / 2;

      for (let col = 0; col < itemsInRow; col++) {
        const x = xOffset + col * spacing;
        const y = totalGridH / 2 - row * rowStep;
        positions.set(needsLayout[idx].id, [x, y, 0]);
        idx++;
      }
    }
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
const CLASS_ORDER = ['energy', 'commodity', 'fear', 'currency', 'equity', 'media'] as const;
type AssetClass = (typeof CLASS_ORDER)[number];

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
  const safeAspect = (Number.isFinite(aspect) && aspect > 0) ? aspect : DEFAULT_ASPECT;
  const sorted = [...tickers].sort((a, b) => {
    const ca = CLASS_ORDER.indexOf(a.class as AssetClass);
    const cb = CLASS_ORDER.indexOf(b.class as AssetClass);
    if (ca !== cb) return (ca === -1 ? Infinity : ca) - (cb === -1 ? Infinity : cb);
    return a.age - b.age;
  });
  return gridLayout(sorted, { aspect: safeAspect });
}
