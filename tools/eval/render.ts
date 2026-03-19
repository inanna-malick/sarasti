/**
 * Batch screenshot harness for the explorer.
 *
 * Usage:
 *   nix-shell --run "npx tsx tools/eval/render.ts configs.json"
 *   echo '{"params":{"alarm":"1.5"},"output":"out.png"}' | nix-shell --run "npx tsx tools/eval/render.ts"
 *
 * Input (file or stdin, one JSON per line):
 *   { "params": { "alarm": "0.8" }, "output": "renders/alarm_0.8.png" }
 *   { "params": { "mode": "raw", "psi8": "3.0" }, "output": "renders/psi8_3.0.png" }
 *
 * headless=true and explorer=true are always injected.
 */

import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

interface RenderConfig {
  params: Record<string, string>;
  output: string;
}

function buildUrl(baseUrl: string, params: Record<string, string>): string {
  const merged: Record<string, string> = {
    explorer: 'true',
    headless: 'true',
    ...params,
  };
  const qs = new URLSearchParams(merged).toString();
  return `${baseUrl}/?${qs}`;
}

async function renderOne(page: any, baseUrl: string, config: RenderConfig): Promise<string> {
  const url = buildUrl(baseUrl, config.params);
  const outPath = resolve(config.output);

  // Ensure output directory exists
  mkdirSync(dirname(outPath), { recursive: true });

  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for explorer to signal ready
  await page.waitForFunction(
    () => (window as any).__EXPLORER_READY === true,
    { timeout: 10000 },
  );

  // Wait one RAF for render to complete
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));

  await page.screenshot({ path: outPath, type: 'png' });
  return outPath;
}

async function main() {
  const port = 0;
  const server = await createServer({
    configFile: resolve(ROOT, 'vite.config.ts'),
    server: { port, strictPort: false },
  });
  await server.listen();
  const resolvedPort = server.httpServer?.address();
  const actualPort = typeof resolvedPort === 'object' && resolvedPort ? resolvedPort.port : 3099;
  const baseUrl = `http://localhost:${actualPort}`;
  console.error(`Vite dev server at ${baseUrl}`);

  const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch({
    headless: true,
    ...(execPath ? { executablePath: execPath } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 512, height: 512 });

    page.on('console', (msg: any) => console.error(`[browser ${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err: any) => console.error(`[browser error] ${err}`));

    // Mode 1: File argument
    const configFile = process.argv[2];
    if (configFile) {
      const raw = readFileSync(resolve(configFile), 'utf-8');
      const parsed = JSON.parse(raw);
      const configs: RenderConfig[] = Array.isArray(parsed) ? parsed : [parsed];

      for (const config of configs) {
        const path = await renderOne(page, baseUrl, config);
        console.log(path);
      }
      return;
    }

    // Mode 2: stdin streaming
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const config: RenderConfig = JSON.parse(line);
        const path = await renderOne(page, baseUrl, config);
        console.log(path);
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } finally {
    await browser?.close();
    await server?.close();
  }
}

main().catch(err => {
  console.error('Render harness failed:', err);
  process.exit(1);
});
