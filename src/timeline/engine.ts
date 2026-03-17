import type { PlaybackState } from '../types';

/**
 * Manages PlaybackState and requestAnimationFrame loop.
 */
export class TimelineEngine {
  get state(): PlaybackState {
    throw new Error('Not implemented — see timeline/engine worktree');
  }

  play(): void { throw new Error('Not implemented'); }
  pause(): void { throw new Error('Not implemented'); }
  seek(_index: number): void { throw new Error('Not implemented'); }
  setSpeed(_speed: number): void { throw new Error('Not implemented'); }
  dispose(): void { throw new Error('Not implemented'); }
}
