import type { FlameModel } from './types';

/**
 * Fetch FLAME .bin files and construct the FlameModel.
 * Progressive: loads template+faces first (render placeholder),
 * then shapedirs+exprdirs (enable deformation).
 */
export async function loadFlameModel(_basePath: string): Promise<FlameModel> {
  throw new Error('Not implemented — see renderer/flame/loader worktree');
}
