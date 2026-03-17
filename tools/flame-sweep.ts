/**
 * FLAME component sweep: screenshot each expression and shape component.
 *
 * Usage: nix-shell --run "npx tsx tools/flame-sweep.ts"
 *
 * Renders each FLAME component individually (one at a time, value=3.0),
 * captures a screenshot grid for expressions ψ₀₋₉₉ and shapes β₀₋₉₉.
 * Outputs annotated grids to test-results/sweep/.
 */

import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SWEEP_DIR = resolve(ROOT, 'test-results/sweep');

const SWEEPS = [
  // Expression: 4 per row, bigger cells, stronger value for visibility
  { mode: 'expr', start: 0, end: 9, value: 5.0, cols: 4, label: 'expr-0-9-pos' },
  { mode: 'expr', start: 0, end: 9, value: -5.0, cols: 4, label: 'expr-0-9-neg' },
  { mode: 'expr', start: 10, end: 19, value: 5.0, cols: 4, label: 'expr-10-19-pos' },
  { mode: 'expr', start: 10, end: 19, value: -5.0, cols: 4, label: 'expr-10-19-neg' },
  { mode: 'expr', start: 20, end: 29, value: 5.0, cols: 4, label: 'expr-20-29-pos' },
  // Shape: first 20, both polarities
  { mode: 'shape', start: 0, end: 9, value: 5.0, cols: 4, label: 'shape-0-9-pos' },
  { mode: 'shape', start: 0, end: 9, value: -5.0, cols: 4, label: 'shape-0-9-neg' },
  { mode: 'shape', start: 10, end: 19, value: 5.0, cols: 4, label: 'shape-10-19-pos' },
  { mode: 'shape', start: 10, end: 19, value: -5.0, cols: 4, label: 'shape-10-19-neg' },
];

async function main() {
  mkdirSync(SWEEP_DIR, { recursive: true });

  console.log('Starting vite dev server...');
  const server = await createServer({ root: ROOT, server: { port: 3098, strictPort: true } });
  await server.listen();
  const baseUrl = 'http://localhost:3098';
  console.log(`  Server at ${baseUrl}`);

  const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  console.log('Launching chromium...');
  const browser = await chromium.launch({
    headless: true,
    ...(execPath ? { executablePath: execPath } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1600, height: 1200 });

  for (const sweep of SWEEPS) {
    console.log(`\n${sweep.label}: ${sweep.mode} [${sweep.start}–${sweep.end}] val=${sweep.value}`);

    const url = `${baseUrl}/tools/sweep.html?mode=${sweep.mode}&start=${sweep.start}&end=${sweep.end}&value=${sweep.value}&cols=${sweep.cols}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for rendering
    await page.waitForFunction(() => {
      const status = document.getElementById('status');
      return status && status.textContent?.startsWith('Done');
    }, { timeout: 30000 });

    // Extra wait for WebGL
    await page.waitForTimeout(1000);

    const path = `${SWEEP_DIR}/${sweep.label}.png`;
    await page.screenshot({ path, type: 'png', fullPage: true });
    console.log(`  Saved: ${path}`);
  }

  await browser.close();
  await server.close();
  console.log('\nDone. Check test-results/sweep/');
}

main().catch(err => {
  console.error('Sweep failed:', err);
  process.exit(1);
});
