import { create } from 'zustand';
import type { FaceParams } from '../types';
import { zeroPose } from '../types';
import { N_SHAPE, N_EXPR } from '../constants';

export interface ExplorerState {
  currentParams: FaceParams | null;
  recompute: () => void;
}

export const useExplorerStore = create<ExplorerState>((set) => ({
  currentParams: null,
  recompute: () => {
    set({
      currentParams: {
        shape: new Float32Array(N_SHAPE).fill(0),
        expression: new Float32Array(N_EXPR).fill(0),
        pose: zeroPose(),
        flush: 0,
        fatigue: 0,
      }
    });
  },
}));

