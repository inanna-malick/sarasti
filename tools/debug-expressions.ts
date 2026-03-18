/**
 * Debug: print expression coefficients at key timestamps.
 * Usage: nix-shell --run "npx tsx tools/debug-expressions.ts"
 */
import { readFileSync } from 'fs';
import { TICKERS } from '../examples/hormuz/tickers';
import { parseDataset, getFrameAtTime } from '../src/data/loader';
import { createResolver } from '../src/binding/resolve';

const raw = JSON.parse(readFileSync('public/data/market-history.json', 'utf-8'));
const dataset = parseDataset(raw, TICKERS);
const resolver = createResolver();

for (const ts of ['2026-02-25T12:00:00Z', '2026-02-28T00:00:00Z', '2026-03-05T00:00:00Z']) {
  console.log(`\n=== ${ts} ===`);
  const frame = getFrameAtTime(dataset, ts);

  for (const ticker of dataset.tickers) {
    const tickerFrame = frame.values[ticker.id];
    if (!tickerFrame) continue;

    const params = resolver.resolve(ticker, tickerFrame);
    const topExpr = Array.from(params.expression)
      .map((v, i) => [i, v] as [number, number])
      .filter(([, v]) => Math.abs(v) > 0.01)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

    const exprMax = topExpr.length > 0 ? Math.abs(topExpr[0][1]) : 0;

    console.log(
      `  ${ticker.id.padEnd(20)} dev=${tickerFrame.deviation.toFixed(3).padStart(7)} ` +
      `exprMax=${exprMax.toFixed(2).padStart(5)} top: ${topExpr.slice(0, 4).map(([i, v]) => `ψ${i}=${v.toFixed(2)}`).join(' ')}`
    );
  }
}
