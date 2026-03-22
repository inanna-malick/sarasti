import React, { useEffect, useRef, useCallback } from 'react';
import type { FaceRenderer, FaceInstance } from '../../../src/types';
import { useStore } from '../../../src/store';

interface FaceOverlayProps {
  renderer: FaceRenderer;
  renderHud: (instance: FaceInstance, screenPos: { x: number; y: number }) => React.ReactNode;
}

// Baseline pixels-per-world-unit at default camera distance.
// At 1080p with ~22 tickers, camera frames so faces are ~120px tall.
// FLAME head ≈ 2.5 world units → ~48 px/unit. HUD offsets are tuned to this.
const BASELINE_SCALE = 48;

// Clamp scale factor so HUD stays readable at extremes
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;

/**
 * Overlay harness: projects 3D face positions to screen space every frame
 * and renders a HUD element for each visible face.
 *
 * - RAF loop calls renderer.projectToScreen for each instance
 * - Applies distance-based scaling so HUD ring tracks face size across zoom
 * - Culls faces behind camera or off-screen
 * - pointerEvents: none so it doesn't intercept mouse
 *
 * DOM position updates happen imperatively in the RAF loop (not via React state)
 * to avoid re-rendering 25 components at 60fps.
 */
export function FaceOverlay({ renderer, renderHud }: FaceOverlayProps) {
  const instances = useStore((s) => s.instances);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  // Use a ref for instances so the RAF closure always sees current data
  // without needing to recreate the callback
  const instancesRef = useRef<FaceInstance[]>(instances);
  instancesRef.current = instances;

  const update = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      rafRef.current = requestAnimationFrame(update);
      return;
    }

    const currentInstances = instancesRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const children = container.children;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const id = el.dataset.faceId;
      if (!id) continue;

      // Find matching instance — instances array is small (~25)
      const inst = currentInstances.find((ins) => ins.id === id);
      if (!inst) {
        el.style.display = 'none';
        continue;
      }

      let projected: { x: number; y: number; scale: number } | null = null;
      try {
        projected = renderer.projectToScreen(inst.position);
      } catch {
        el.style.display = 'none';
        continue;
      }

      if (!projected) {
        el.style.display = 'none';
        continue;
      }

      // Cull off-screen (with margin for HUD elements extending beyond center)
      const margin = 100;
      if (projected.x < -margin || projected.x > w + margin || projected.y < -margin || projected.y > h + margin) {
        el.style.display = 'none';
        continue;
      }

      // Scale HUD relative to baseline zoom level
      const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, projected.scale / BASELINE_SCALE));

      el.style.transform = `translate(${projected.x}px, ${projected.y}px) scale(${s.toFixed(3)})`;
      el.style.display = '';
    }

    rafRef.current = requestAnimationFrame(update);
  }, [renderer]); // Only depends on renderer — instances accessed via ref

  useEffect(() => {
    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [update]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {instances.map((inst) => (
        <div
          key={inst.id}
          data-face-id={inst.id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'none',
            willChange: 'transform',
          }}
        >
          {renderHud(inst, { x: 0, y: 0 })}
        </div>
      ))}
    </div>
  );
}
