import { create } from 'zustand';
import type { FaceParams } from '../types';

export interface ExplorerState {
  currentParams: FaceParams | null;
  recompute: () => void;
}

export const useExplorerStore = create<ExplorerState>((set) => ({
  currentParams: null,
  recompute: () => {
    // Stub implementation
  },
}));
