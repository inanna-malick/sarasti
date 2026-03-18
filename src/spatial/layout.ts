import type { TickerConfig, LayoutResult, AssetClass } from '../types';
import { FACE_SPACING } from '../constants';

const FACE_RADIUS = 1.0;
const SPACING = FACE_SPACING * FACE_RADIUS;
const CLASS_GAP = SPACING * 0.8; // extra gap between class columns
const ROW_GAP = SPACING * 1.2;  // gap between class-row bands (portrait wrap)

/** Threat-proximity order: energy first (Hormuz), media last. */
const CLASS_ORDER: AssetClass[] = ['energy', 'commodity', 'fear', 'currency', 'equity', 'media'];

/**
 * Unified threat-field layout.
 *
 * X-axis: asset class columns (threat-proximity order).
 * Y-axis: age within each class (youngest/most reactive at top).
 * Inter-class gaps wider than intra-class spacing for visual clustering.
 *
 * When aspect ratio is provided, the layout wraps class columns into
 * multiple rows to better fill the viewport (e.g. portrait phones).
 */
export function computeLayout(tickers: TickerConfig[], aspect: number = 16 / 9): LayoutResult {
  const positions = new Map<string, [number, number, number]>();

  // Group tickers by class, filter empty
  const groups: { cls: AssetClass; tickers: TickerConfig[] }[] = [];
  const byClass = new Map<AssetClass, TickerConfig[]>();
  for (const t of tickers) {
    let arr = byClass.get(t.class);
    if (!arr) {
      arr = [];
      byClass.set(t.class, arr);
    }
    arr.push(t);
  }
  for (const cls of CLASS_ORDER) {
    const arr = byClass.get(cls);
    if (arr && arr.length > 0) {
      arr.sort((a, b) => a.age - b.age);
      groups.push({ cls, tickers: arr });
    }
  }

  if (groups.length === 0) return { positions };

  // Decide how many class-columns per row based on aspect ratio.
  // Each class column is ~1 unit wide + gap. A face column with N faces
  // is N*SPACING tall. We want the overall grid aspect ≈ viewport aspect.
  const colsPerRow = chooseColsPerRow(groups.length, groups, aspect);

  // Arrange class groups into rows of colsPerRow
  let rowY = 0;
  for (let i = 0; i < groups.length; i += colsPerRow) {
    const rowGroups = groups.slice(i, i + colsPerRow);

    // Find tallest column in this row for vertical centering + row offset
    let maxHeight = 0;
    for (const g of rowGroups) {
      const h = (g.tickers.length - 1) * SPACING;
      if (h > maxHeight) maxHeight = h;
    }

    // Place each class column in this row
    for (let c = 0; c < rowGroups.length; c++) {
      const g = rowGroups[c];
      const x = c * (SPACING + CLASS_GAP);
      const colHeight = (g.tickers.length - 1) * SPACING;

      for (let row = 0; row < g.tickers.length; row++) {
        const y = rowY + colHeight / 2 - row * SPACING;
        positions.set(g.tickers[row].id, [x, y, 0]);
      }
    }

    // Next row band starts below this one
    rowY -= maxHeight + ROW_GAP;
  }

  // Center the whole layout at origin
  centerAtOrigin(positions);

  return { positions };
}

/**
 * Choose how many class columns fit per row given the viewport aspect ratio.
 * Tries to make the overall grid aspect ratio close to the viewport aspect.
 */
function chooseColsPerRow(
  numGroups: number,
  groups: { tickers: TickerConfig[] }[],
  aspect: number,
): number {
  // For very wide screens, all columns in one row
  if (aspect >= 1.2) return numGroups;

  // For narrower screens, find the split that best matches aspect
  const avgColHeight = groups.reduce((s, g) => s + g.tickers.length, 0) / groups.length * SPACING;
  let bestCols = numGroups;
  let bestScore = Infinity;

  for (let cols = 2; cols <= numGroups; cols++) {
    const rows = Math.ceil(numGroups / cols);
    const gridW = cols * (SPACING + CLASS_GAP) - CLASS_GAP;
    const gridH = rows * (avgColHeight + ROW_GAP) - ROW_GAP;
    const gridAspect = gridW / Math.max(gridH, 0.01);
    const score = Math.abs(Math.log(gridAspect / aspect));
    if (score < bestScore) {
      bestScore = score;
      bestCols = cols;
    }
  }

  return bestCols;
}

function centerAtOrigin(positions: Map<string, [number, number, number]>): void {
  if (positions.size === 0) return;
  const allPos = Array.from(positions.values());
  const minX = Math.min(...allPos.map(p => p[0]));
  const maxX = Math.max(...allPos.map(p => p[0]));
  const minY = Math.min(...allPos.map(p => p[1]));
  const maxY = Math.max(...allPos.map(p => p[1]));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  for (const pos of positions.values()) {
    pos[0] -= cx;
    pos[1] -= cy;
  }
}
