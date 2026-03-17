/**
 * Headless screenshot utilities for visual checks.
 * Used by Playwright tests and tools/visual-check.ts.
 */

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  outputPath?: string;
}

export async function takeScreenshot(
  _page: unknown,
  _options?: ScreenshotOptions,
): Promise<Buffer> {
  throw new Error('Not implemented — filled in by renderer TL');
}

/**
 * Compare two screenshots using structural similarity.
 * Returns SSIM score (0-1, 1 = identical).
 */
export function compareScreenshots(
  _a: Buffer,
  _b: Buffer,
): number {
  throw new Error('Not implemented — filled in by renderer TL');
}
