/**
 * Bridges timeline engine → data loader → binding → renderer.
 * On each frame change: fetch frame, resolve all tickers, update renderer.
 */
export class FrameDriver {
  dispose(): void {
    throw new Error('Not implemented — see timeline/frame-driver worktree');
  }
}
