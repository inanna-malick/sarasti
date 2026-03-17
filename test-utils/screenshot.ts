import type { Page } from '@playwright/test';

/**
 * Headless screenshot utilities for visual checks.
 * Used by Playwright tests and tools/visual-check.ts.
 */

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  outputPath?: string;
  /** Selector to wait for before capturing (default: '#viewport canvas') */
  waitForSelector?: string;
  /** Additional delay after selector appears, in ms */
  settleMs?: number;
}

const DEFAULTS = {
  width: 1280,
  height: 720,
  waitForSelector: '#viewport canvas',
  settleMs: 200,
};

export async function takeScreenshot(
  page: Page,
  options: ScreenshotOptions = {},
): Promise<Buffer> {
  const opts = { ...DEFAULTS, ...options };

  await page.setViewportSize({ width: opts.width, height: opts.height });

  if (opts.waitForSelector) {
    await page.waitForSelector(opts.waitForSelector, { timeout: 10000 });
  }
  if (opts.settleMs > 0) {
    await page.waitForTimeout(opts.settleMs);
  }

  const buffer = await page.screenshot({
    type: 'png',
    ...(opts.outputPath ? { path: opts.outputPath } : {}),
  });

  return buffer;
}

/**
 * Compare two PNG screenshot buffers using pixel-level RMSE.
 * Returns similarity score 0-1 (1 = identical).
 * This is a simple implementation — not true SSIM, but sufficient
 * for detecting visual regressions.
 */
export function compareScreenshots(a: Buffer, b: Buffer): number {
  if (a.length !== b.length) return 0;
  let sumSqDiff = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = (a[i] - b[i]) / 255;
    sumSqDiff += diff * diff;
  }
  const rmse = Math.sqrt(sumSqDiff / a.length);
  return Math.max(0, 1 - rmse);
}

/**
 * Save a baseline screenshot for comparison.
 */
export async function saveBaseline(
  page: Page,
  name: string,
  options: ScreenshotOptions = {},
): Promise<string> {
  const path = `test-results/baselines/${name}.png`;
  await takeScreenshot(page, { ...options, outputPath: path });
  return path;
}
