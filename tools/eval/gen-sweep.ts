/**
 * Batch config generator for the render harness.
 *
 * Usage:
 *   npx tsx tools/eval/gen-sweep.ts --ticker BRENT --times "2026-03-05,2026-03-10" --camera front,left34
 *   npx tsx tools/eval/gen-sweep.ts --census --t "2026-03-11T14:00:00Z" --camera front
 *   npx tsx tools/eval/gen-sweep.ts --census --t "2026-03-11T14:00:00Z" --name my-sweep
 *
 * Outputs JSON array to stdout. Pipe to render.ts:
 *   npx tsx tools/eval/gen-sweep.ts --census --t "2026-03-11" | npx tsx tools/eval/render.ts
 */

import { parseArgs } from 'node:util';
import { TICKERS } from '../../examples/demo/tickers';

interface RenderConfig {
  params: Record<string, string>;
  output: string;
}

const { values } = parseArgs({
  options: {
    ticker: { type: 'string' },
    times: { type: 'string' },
    t: { type: 'string' },
    camera: { type: 'string', default: 'front' },
    census: { type: 'boolean', default: false },
    name: { type: 'string' },
  },
  strict: true,
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

function sanitizeTickerId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

const cameras = (values.camera ?? 'front').split(',').map(s => s.trim());
const configs: RenderConfig[] = [];

if (values.census) {
  // Census mode: all tickers at one timestamp
  const timestamp = values.t;
  if (!timestamp) {
    console.error('Error: --census requires --t <timestamp>');
    process.exit(1);
  }

  const name = values.name ?? `census-${formatDate(timestamp)}`;
  const dateStr = formatDate(timestamp);

  for (const ticker of TICKERS) {
    for (const cam of cameras) {
      configs.push({
        params: {
          explorer: 'true',
          mode: 'data',
          ticker: ticker.id,
          t: timestamp,
          camera: cam,
        },
        output: `tools/eval/data/renders/${name}/${sanitizeTickerId(ticker.id)}_${dateStr}_${cam}.png`,
      });
    }
  }
} else if (values.ticker) {
  // Single ticker across multiple times
  const tickerIds = values.ticker.split(',').map(s => s.trim());
  const times = (values.times ?? values.t ?? '').split(',').map(s => s.trim()).filter(Boolean);

  if (times.length === 0) {
    console.error('Error: --ticker requires --times or --t');
    process.exit(1);
  }

  const name = values.name ?? `sweep-${tickerIds.join('-')}`;

  for (const tickerId of tickerIds) {
    for (const timestamp of times) {
      const dateStr = formatDate(timestamp);
      for (const cam of cameras) {
        configs.push({
          params: {
            explorer: 'true',
            mode: 'data',
            ticker: tickerId,
            t: timestamp,
            camera: cam,
          },
          output: `tools/eval/data/renders/${name}/${sanitizeTickerId(tickerId)}_${dateStr}_${cam}.png`,
        });
      }
    }
  }
} else {
  console.error('Error: specify --census or --ticker <id>');
  process.exit(1);
}

console.log(JSON.stringify(configs, null, 2));
