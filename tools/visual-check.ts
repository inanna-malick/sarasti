/**
 * Visual verification: screenshots at key timestamps.
 *
 * Usage: nix-shell --run "npx tsx tools/visual-check.ts"
 *
 * Starts vite dev server, navigates headless Chromium to the app
 * at different ?t= timestamps, captures screenshots.
 */

import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCREENSHOTS_DIR = resolve(ROOT, 'test-results/screenshots');

const TIMESTAMPS = [
  { label: 'pre-crisis',   time: '2026-02-25T12:00:00Z' },
  { label: 'strike-onset', time: '2026-02-28T00:00:00Z' },
  { label: 'sustained',    time: '2026-03-05T00:00:00Z' },
  { label: 'present',      time: '2026-03-10T00:00:00Z' },
];

async function main() {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  // Start vite dev server
  console.log('Starting vite dev server...');
  const server = await createServer({ root: ROOT, server: { port: 3099, strictPort: true } });
  await server.listen();
  const baseUrl = 'http://localhost:3099';
  console.log(`  Server at ${baseUrl}`);

  // Launch headless chromium
  const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  console.log(`Launching chromium...`);
  const browser = await chromium.launch({
    headless: true,
    ...(execPath ? { executablePath: execPath } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  for (const { label, time } of TIMESTAMPS) {
    console.log(`\n${label} (${time})`);
    const url = `${baseUrl}/?t=${encodeURIComponent(time)}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for canvas to appear and WebGL to render
    try {
      await page.waitForSelector('canvas', { timeout: 15000 });
    } catch {
      console.log('  Warning: no canvas found');
    }
    await page.waitForTimeout(2000);

    const path = `${SCREENSHOTS_DIR}/${label}.png`;
    await page.screenshot({ path, type: 'png' });
    console.log(`  Saved: ${path}`);

    // Read status text
    const status = await page.textContent('#app > div:last-child').catch(() => '?');
    console.log(`  Status: ${status?.trim()}`);
  }

  await browser.close();
  await server.close();
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Visual check failed:', err);
  process.exit(1);
});
