import type { Page } from '@playwright/test';
import type { FaceInstance, FaceRenderer } from '../src/types';

/**
 * Set up a headless test page with a renderer mounted in the viewport div.
 * Injects a global `__renderer` and `__setInstances` for test scripts to call.
 *
 * Usage in Playwright test:
 *   await setupHeadlessRenderer(page, 'flame');
 *   await page.evaluate((instances) => {
 *     (window as any).__setInstances(instances);
 *   }, instances);
 *   await takeScreenshot(page, { outputPath: 'test.png' });
 */
export async function setupHeadlessRenderer(
  page: Page,
  rendererType: 'flame' | 'svg' = 'flame',
): Promise<void> {
  await page.goto('http://localhost:3000');

  // Wait for the app to mount
  await page.waitForSelector('#viewport', { timeout: 10000 });

  // Inject test harness — the actual renderer will be loaded by the app
  await page.evaluate((type) => {
    (window as any).__rendererType = type;
    (window as any).__testMode = true;
  }, rendererType);
}

/**
 * Evaluate renderer.setInstances() in the browser context.
 * Serializes FaceInstance[] (converting Float32Arrays to plain arrays for transfer).
 */
export async function setInstancesInPage(
  page: Page,
  instances: FaceInstance[],
): Promise<void> {
  // Serialize Float32Arrays for page.evaluate transfer
  const serialized = instances.map(inst => ({
    ...inst,
    params: {
      shape: Array.from(inst.params.shape),
      expression: Array.from(inst.params.expression),
    },
  }));

  await page.evaluate((data) => {
    const renderer = (window as any).__renderer as FaceRenderer | undefined;
    if (!renderer) throw new Error('Renderer not initialized in test mode');

    // Reconstruct Float32Arrays
    const instances = data.map((d: any) => ({
      ...d,
      params: {
        shape: new Float32Array(d.params.shape),
        expression: new Float32Array(d.params.expression),
      },
    }));
    renderer.setInstances(instances);
  }, serialized);
}
