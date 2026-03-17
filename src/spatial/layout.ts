import type { TickerConfig, LayoutStrategy, LayoutResult, AssetClass } from '../types';
import { FACE_SPACING } from '../constants';

const FACE_RADIUS = 1.0;
const SPACING = FACE_SPACING * FACE_RADIUS;

export function computeLayout(tickers: TickerConfig[], strategy: LayoutStrategy): LayoutResult {
  const positions = new Map<string, [number, number, number]>();

  switch (strategy.kind) {
    case 'family-rows':
      computeFamilyRows(tickers, positions);
      break;
    case 'class-clusters':
      computeClassClusters(tickers, positions);
      break;
    case 'reactivity-sweep':
      computeReactivitySweep(tickers, positions);
      break;
    default: {
      const exhaustiveCheck: never = strategy;
      throw new Error(`Unhandled strategy kind: ${(exhaustiveCheck as any).kind}`);
    }
  }

  return { positions };
}

function computeFamilyRows(tickers: TickerConfig[], positions: Map<string, [number, number, number]>) {
  const assetClassOrder: AssetClass[] = ['energy', 'fear', 'currency', 'equity', 'media'];

  // One row per asset class. Within each row, tickers are grouped by family
  // then sorted by age (youngest left, oldest right).
  const rows: TickerConfig[][] = [];
  for (const ac of assetClassOrder) {
    const acTickers = tickers.filter(t => t.class === ac);
    if (acTickers.length === 0) continue;

    // Group by family, sort families by first ticker's age, sort within family by age
    const familyMap = new Map<string, TickerConfig[]>();
    for (const t of acTickers) {
      let fam = familyMap.get(t.family);
      if (!fam) { fam = []; familyMap.set(t.family, fam); }
      fam.push(t);
    }
    const sorted: TickerConfig[] = [];
    const families = [...familyMap.entries()].sort(
      ([, a], [, b]) => Math.min(...a.map(t => t.age)) - Math.min(...b.map(t => t.age))
    );
    for (const [, fam] of families) {
      sorted.push(...fam.sort((a, b) => a.age - b.age));
    }
    rows.push(sorted);
  }

  // Find the widest row to left-align all rows consistently
  const maxCols = Math.max(...rows.map(r => r.length));
  const totalWidth = (maxCols - 1) * SPACING;
  const rowCount = rows.length;
  const startY = (rowCount - 1) * SPACING / 2;

  rows.forEach((row, rowIndex) => {
    const y = startY - rowIndex * SPACING;
    // Center each row
    const rowWidth = (row.length - 1) * SPACING;
    const startX = -rowWidth / 2;

    row.forEach((ticker, colIndex) => {
      positions.set(ticker.id, [startX + colIndex * SPACING, y, 0]);
    });
  });
}

function computeClassClusters(tickers: TickerConfig[], positions: Map<string, [number, number, number]>) {
  const assetClasses: AssetClass[] = ['energy', 'fear', 'currency', 'equity', 'media'];
  const clusters = assetClasses.map(ac => ({
    class: ac,
    tickers: tickers.filter(t => t.class === ac).sort((a, b) => a.age - b.age)
  }));

  // 3x2 Grid of clusters
  // Energy (0,1), Fear (1,1), Currency (2,1)
  // Equity (0,0), Media (1,0)
  const clusterCoords = [
    [0, 1], [1, 1], [2, 1],
    [0, 0], [1, 0]
  ];

  // Gap between cluster centers — derived from the largest cluster so they don't overlap
  const maxClusterSize = Math.max(...clusters.map(c => Math.ceil(Math.sqrt(c.tickers.length))));
  const CLUSTER_SPACING = SPACING * (maxClusterSize + 3);

  clusters.forEach((cluster, i) => {
    if (cluster.tickers.length === 0) return;

    const [cx, cy] = clusterCoords[i];
    const centerX = (cx - 1.0) * CLUSTER_SPACING;
    const centerY = (cy - 0.5) * CLUSTER_SPACING;

    // Within cluster, arrange in a small grid or line.
    // Ensure cols is at least 1.
    const cols = Math.max(1, Math.ceil(Math.sqrt(cluster.tickers.length)));
    const startX = centerX - ((cols - 1) * SPACING) / 2;
    const startY = centerY + ((Math.ceil(cluster.tickers.length / cols) - 1) * SPACING) / 2;

    cluster.tickers.forEach((ticker, index) => {
      const r = Math.floor(index / cols);
      const c = index % cols;
      positions.set(ticker.id, [
        startX + c * SPACING,
        startY - r * SPACING,
        0
      ]);
    });
  });
}

function computeReactivitySweep(tickers: TickerConfig[], positions: Map<string, [number, number, number]>) {
  const sorted = [...tickers].sort((a, b) => a.age - b.age);
  const totalWidth = sorted.length > 0 ? (sorted.length - 1) * SPACING : 0;
  const startX = -totalWidth / 2;

  sorted.forEach((ticker, index) => {
    positions.set(ticker.id, [startX + index * SPACING, 0, 0]);
  });
}
