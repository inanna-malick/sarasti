import React from 'react';
import type { FaceRenderer, FaceInstance } from '../../../src/types';
import { useStore } from '../../../src/store';
import { FaceOverlay as LibFaceOverlay } from '../../../src/ui';

interface FaceOverlayProps {
  renderer: FaceRenderer;
  renderHud: (instance: FaceInstance, screenPos: { x: number; y: number }) => React.ReactNode;
}

export function FaceOverlay({ renderer, renderHud }: FaceOverlayProps) {
  const instances = useStore((s) => s.instances);
  return (
    <LibFaceOverlay
      renderer={renderer}
      instances={instances}
      renderHud={(inst, pos) => {
        const fullInst = instances.find((i) => i.id === inst.id);
        return fullInst ? renderHud(fullInst, pos) : null;
      }}
    />
  );
}
