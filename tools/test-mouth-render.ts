/**
 * Test render: mouth interior visibility at different jaw angles.
 *
 * Usage: nix-shell --run "npx tsx tools/test-mouth-render.ts"
 */

import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'test-results/mouth-renders');

const CONFIGS = [
  {
    label: 'jaw-closed',
    config: {
      tickerId: 'CL1',
      overrides: { maxJaw: 0.0, expressionIntensity: 10.0 },
      frame: { deviation: 0.0, velocity: 0.0, volatility: 0.0 },
    },
  },
  {
    label: 'jaw-slight',
    config: {
      tickerId: 'CL1',
      overrides: { maxJaw: 0.2, expressionIntensity: 10.0 },
      frame: { deviation: 0.1, velocity: 0.5, volatility: 2.0 },
    },
  },
  {
    label: 'jaw-wide-open',
    config: {
      tickerId: 'CL1',
      overrides: { maxJaw: 0.2, expressionIntensity: 10.0 },
      frame: { deviation: 0.5, velocity: 2.0, volatility: 3.5 },
    },
  },
  {
    label: 'jaw-scream',
    config: {
      tickerId: 'CL1',
      overrides: { maxJaw: 0.2, expressionIntensity: 15.0 },
      frame: { deviation: 1.0, velocity: 3.0, volatility: 5.0 },
    },
  },
];

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const port = 3097;
  console.log('Starting vite dev server...');
  const server = await createServer({ root: ROOT, server: { port, strictPort: true } });
  await server.listen();
  const baseUrl = `http://localhost:${port}`;

  const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch({
    headless: true,
    ...(execPath ? { executablePath: execPath } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 512, height: 512 });

    const url = `${baseUrl}/?refine=true`;
    console.log(`Loading ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });

    await page.waitForFunction(() => (window as any).__REFINE_READY === true, { timeout: 30000 });
    console.log('Harness ready.\n');

    for (const { label, config } of CONFIGS) {
      const version = Date.now();

      await page.evaluate(({ cfg, ver }) => {
        (window as any).__REFINE_CONFIG = cfg;
        (window as any).__REFINE_TARGET_VERSION = ver;
      }, { cfg: config, ver: version });

      await page.waitForFunction(
        (v) => (window as any).__REFINE_RENDERED_VERSION === v,
        version,
        { timeout: 5000 },
      );

      // Let the frame settle
      await page.waitForTimeout(200);

      const path = resolve(OUT_DIR, `${label}.png`);
      await page.screenshot({ path, type: 'png' });
      console.log(`${label}: ${path}`);
    }

    console.log('\nDone. Check test-results/mouth-renders/');
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch(err => {
  console.error('Mouth render test failed:', err);
  process.exit(1);
});
