/**
 * Close-up expression comparison: renders selected faces large,
 * side-by-side across timestamps, to verify expression deformation.
 *
 * Usage: nix-shell --run "npx tsx tools/closeup-check.ts"
 */

import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'test-results/screenshots');

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('Starting vite dev server...');
  const server = await createServer({ root: ROOT, server: { port: 3097, strictPort: true } });
  await server.listen();
  const baseUrl = 'http://localhost:3097';

  const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch({
    headless: true,
    ...(execPath ? { executablePath: execPath } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1600, height: 800 });

  // Navigate to the closeup comparison page
  const url = `${baseUrl}/tools/closeup.html`;
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for rendering to complete
  await page.waitForFunction(() => {
    const status = document.getElementById('status');
    return status && status.textContent?.startsWith('Done');
  }, { timeout: 30000 });
  await page.waitForTimeout(1500);

  const path = `${OUT_DIR}/closeup-comparison.png`;
  await page.screenshot({ path, type: 'png', fullPage: true });
  console.log(`Saved: ${path}`);

  await browser.close();
  await server.close();
  console.log('Done.');
}

main().catch(err => {
  console.error('Close-up check failed:', err);
  process.exit(1);
});
