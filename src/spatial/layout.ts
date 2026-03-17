import { TickerConfig, LayoutStrategy, LayoutResult, AssetClass } from '../types';

const FACE_RADIUS = 1.0;
const SPACING = 2.5 * FACE_RADIUS;

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
  }

  return { positions };
}

function computeFamilyRows(tickers: TickerConfig[], positions: Map<string, [number, number, number]>) {
  const assetClassOrder: AssetClass[] = ['energy', 'fear', 'equity', 'media'];
  
  // Group tickers by family, maintaining asset class order for families
  const families: { id: string, class: AssetClass, tickers: TickerConfig[] }[] = [];
  const familyMap = new Map<string, TickerConfig[]>();
  
  // To preserve order of families as they appear in assetClassOrder
  for (const ac of assetClassOrder) {
    const acTickers = tickers.filter(t => t.class === ac);
    const acFamilies: string[] = [];
    for (const t of acTickers) {
      if (!acFamilies.includes(t.family)) {
        acFamilies.push(t.family);
      }
    }
    for (const familyId of acFamilies) {
      families.push({
        id: familyId,
        class: ac,
        tickers: acTickers.filter(t => t.family === familyId).sort((a, b) => a.age - b.age)
      });
    }
  }

  // Energy families top (highest Y), Media bottom (lowest Y)
  // We have 'families.length' rows.
  const rowCount = families.length;
  const startY = (rowCount - 1) * SPACING / 2;

  families.forEach((family, rowIndex) => {
    const y = startY - rowIndex * SPACING;
    const rowWidth = (family.tickers.length - 1) * SPACING;
    const startX = -rowWidth / 2;

    family.tickers.forEach((ticker, colIndex) => {
      const x = startX + colIndex * SPACING;
      positions.set(ticker.id, [x, y, 0]);
    });
  });
}

function computeClassClusters(tickers: TickerConfig[], positions: Map<string, [number, number, number]>) {
  const assetClasses: AssetClass[] = ['energy', 'fear', 'equity', 'media'];
  const clusters = assetClasses.map(ac => ({
    class: ac,
    tickers: tickers.filter(t => t.class === ac).sort((a, b) => a.age - b.age)
  }));

  // 2x2 Grid of clusters
  // Energy (0,1), Fear (1,1)
  // Equity (0,0), Media (1,0)
  const clusterCoords = [
    [0, 1], [1, 1],
    [0, 0], [1, 0]
  ];

  const CLUSTER_SPACING = SPACING * 10;

  clusters.forEach((cluster, i) => {
    const [cx, cy] = clusterCoords[i];
    const centerX = (cx - 0.5) * CLUSTER_SPACING;
    const centerY = (cy - 0.5) * CLUSTER_SPACING;

    // Within cluster, arrange in a small grid or line. Let's do a line for simplicity if few, or a small grid.
    // Actually, "arrange by age" - let's do a simple wrap-around grid within each cluster.
    const cols = Math.ceil(Math.sqrt(cluster.tickers.length));
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
  const totalWidth = (sorted.length - 1) * SPACING;
  const startX = -totalWidth / 2;

  sorted.forEach((ticker, index) => {
    positions.set(ticker.id, [startX + index * SPACING, 0, 0]);
  });
}
