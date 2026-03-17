import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import * as readline from 'readline';
import * as crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const RENDERS_DIR = resolve(ROOT, 'tools/refine/data/renders');

async function main() {
  mkdirSync(RENDERS_DIR, { recursive: true });

  const port = 3099;
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
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for the harness to declare itself ready
    await page.waitForFunction(() => (window as any).__REFINE_READY === true, { timeout: 15000 });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      
      try {
        const config = JSON.parse(line);
        const currentRenderVersion = Date.now();
        
        // Inject config
        await page.evaluate(({cfg, version}) => {
          (window as any).__REFINE_CONFIG = cfg;
          (window as any).__REFINE_TARGET_VERSION = version;
        }, { cfg: config, version: currentRenderVersion });

        // Wait for the render loop to acknowledge the config and finish rendering
        await page.waitForFunction(
          (version) => (window as any).__REFINE_RENDERED_VERSION === version,
          currentRenderVersion,
          { timeout: 5000 }
        );
        
        const hash = crypto.createHash('md5').update(line).digest('hex').substring(0, 8);
        const safeTickerId = config.tickerId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 32);
        const filename = `render_${safeTickerId}_${hash}_${currentRenderVersion}.png`;
        const path = resolve(RENDERS_DIR, filename);

        await page.screenshot({ path, type: 'png' });
        
        // Write path to stdout
        console.log(path);
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
