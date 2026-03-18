import type { TickerConfig, LayoutResult, AssetClass } from '../types';
import { FACE_SPACING } from '../constants';

const FACE_RADIUS = 1.0;
const SPACING = FACE_SPACING * FACE_RADIUS;

/** Threat-proximity order: energy closest to crisis epicenter, then outward. */
const CLASS_ORDER: AssetClass[] = ['energy', 'commodity', 'fear', 'currency', 'equity', 'media'];

const DEFAULT_ASPECT = 16 / 9;

/**
 * Uniform threat-field grid layout.
 *
 * Tickers sorted in threat-proximity order (energy first, media last),
 * then by age ascending within each class. Placed left→right, top→bottom
 * in a rectangular grid whose aspect ratio approximates the viewport.
 * Last row centered when it has fewer items.
 */
export function computeLayout(tickers: TickerConfig[], aspect: number = DEFAULT_ASPECT): LayoutResult {
  const positions = new Map<string, [number, number, number]>();
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : DEFAULT_ASPECT;

  const sorted = sortByThreatProximity(tickers);
  placeGrid(sorted, positions, safeAspect);
  return { positions };
}

/**
 * Place tickers in a uniform rectangular grid, centered at origin.
 * Chooses cols×rows where cols×rows >= N and grid aspect ≈ viewport aspect.
 * Last row is centered if it has fewer items than cols.
 */
function placeGrid(
  tickers: TickerConfig[],
  positions: Map<string, [number, number, number]>,
  viewportAspect: number,
): void {
  if (tickers.length === 0) return;

  const n = tickers.length;
  const { cols, rows } = chooseGrid(n, viewportAspect);

  const gridH = (rows - 1) * SPACING;

  tickers.forEach((ticker, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Center the last row if it has fewer items
    const itemsInRow = row < rows - 1 ? cols : n - row * cols;
    const rowW = (itemsInRow - 1) * SPACING;
    const xOffset = -rowW / 2;

    const x = xOffset + col * SPACING;
    const y = gridH / 2 - row * SPACING;
    positions.set(ticker.id, [x, y, 0]);
  });
}

/**
 * Choose cols×rows where cols×rows >= N and grid aspect ≈ viewport aspect.
 * Grid aspect = (cols - 1) / (rows - 1) for spacing purposes.
 */
function chooseGrid(n: number, aspect: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 };

  // cols/rows ≈ aspect, cols * rows >= n
  let bestCols = Math.round(Math.sqrt(n * aspect));
  bestCols = Math.max(1, Math.min(n, bestCols));

  // Try nearby column counts and pick the one whose aspect is closest
  let bestScore = Infinity;
  let finalCols = bestCols;
  let finalRows = Math.ceil(n / bestCols);

  for (let c = Math.max(1, bestCols - 2); c <= Math.min(n, bestCols + 2); c++) {
    const r = Math.ceil(n / c);
    const gridAspect = r <= 1 ? aspect : (c - 1) / (r - 1);
    const score = Math.abs(Math.log(gridAspect / aspect));
    if (score < bestScore || (score === bestScore && c * r < finalCols * finalRows)) {
      bestScore = score;
      finalCols = c;
      finalRows = r;
    }
  }

  return { cols: finalCols, rows: finalRows };
}

/**
 * Sort by threat-proximity class order, then by age ascending within each class.
 * Unknown classes sort last.
 */
function sortByThreatProximity(tickers: TickerConfig[]): TickerConfig[] {
  return [...tickers].sort((a, b) => {
    const ca = CLASS_ORDER.indexOf(a.class);
    const cb = CLASS_ORDER.indexOf(b.class);
    if (ca !== cb) return (ca === -1 ? Infinity : ca) - (cb === -1 ? Infinity : cb);
    return a.age - b.age;
  });
}
