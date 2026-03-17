import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import * as readline from 'readline';
import * as crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const RENDERS_DIR = resolve(ROOT, 'tools/refine/data/renders');

interface RefineConfig {
  tickerId: string;
  overrides: Record<string, number>;
  frame: { deviation: number; velocity: number; volatility: number };
}

async function renderConfigs(page: any, configs: RefineConfig[]): Promise<string[]> {
  const paths: string[] = [];

  for (const config of configs) {
    const currentRenderVersion = Date.now();

    await page.evaluate(({cfg, version}: {cfg: RefineConfig; version: number}) => {
      (window as any).__REFINE_CONFIG = cfg;
      (window as any).__REFINE_TARGET_VERSION = version;
    }, { cfg: config, version: currentRenderVersion });

    await page.waitForFunction(
      (version: number) => (window as any).__REFINE_RENDERED_VERSION === version,
      currentRenderVersion,
      { timeout: 5000 },
    );

    const configStr = JSON.stringify(config);
    const hash = crypto.createHash('md5').update(configStr).digest('hex').substring(0, 8);
    const safeTickerId = config.tickerId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 32);
    const filename = `render_${safeTickerId}_${hash}_${currentRenderVersion}.png`;
    const path = resolve(RENDERS_DIR, filename);

    await page.screenshot({ path, type: 'png' });
    paths.push(path);
  }

  return paths;
}

async function main() {
  mkdirSync(RENDERS_DIR, { recursive: true });

  const port = 0; // OS-assigned random port
  const server = await createServer({ root: ROOT, server: { port, strictPort: false } });
  await server.listen();
  const resolvedPort = server.httpServer?.address();
  const actualPort = typeof resolvedPort === 'object' && resolvedPort ? resolvedPort.port : port;
  const baseUrl = `http://localhost:${actualPort}`;

  const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch({
    headless: true,
    ...(execPath ? { executablePath: execPath } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 512, height: 512 });

    page.on('console', (msg: any) => console.error(`[browser ${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err: any) => console.error(`[browser error] ${err}`));
    page.on('requestfailed', (req: any) => console.error(`[browser 404] ${req.url()} — ${req.failure()?.errorText}`));

    const url = `${baseUrl}/?refine=true`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (window as any).__REFINE_READY === true, { timeout: 15000 });

    // Mode 1: File argument — read configs from JSON file (array or single object)
    const configFile = process.argv[2];
    if (configFile) {
      const raw = readFileSync(resolve(configFile), 'utf-8');
      const parsed = JSON.parse(raw);
      const configs: RefineConfig[] = Array.isArray(parsed) ? parsed : [parsed];
      const paths = await renderConfigs(page, configs);
      for (const p of paths) console.log(p);
      return;
    }

    // Mode 2: stdin — one JSON config per line (for optimizer IPC)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const config: RefineConfig = JSON.parse(line);
        const paths = await renderConfigs(page, [config]);
        for (const p of paths) console.log(p);
      } catch (err) {
        console.error(`Error processing line: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } finally {
    await browser?.close();
    await server?.close();
  }
}

main().catch(err => {
  console.error('Harness failed:', err);
  process.exit(1);
});
