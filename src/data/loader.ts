import type { TimelineDataset, Frame } from '../types';

/**
 * Fetch and parse market-history.json into TimelineDataset.
 */
export async function loadDataset(_url: string): Promise<TimelineDataset> {
  throw new Error('Not implemented — see data/loader worktree');
}

/**
 * Get frame by index.
 */
export function getFrame(_dataset: TimelineDataset, _index: number): Frame {
  throw new Error('Not implemented');
}

/**
 * Get frame nearest to ISO timestamp.
 */
export function getFrameAtTime(_dataset: TimelineDataset, _isoString: string): Frame {
  throw new Error('Not implemented');
}

/**
 * Linear interpolation between two frames.
 */
export function interpolateFrame(_f0: Frame, _f1: Frame, _alpha: number): Frame {
  throw new Error('Not implemented');
}
