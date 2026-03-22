import React, { useEffect, useRef, useCallback } from 'react';

export interface OverlayInstance {
  id: string;
  position: [number, number, number];
}

interface OverlayRenderer {
  projectToScreen(pos: [number, number, number]): { x: number; y: number; scale: number } | null;
}

interface FaceOverlayProps {
  renderer: OverlayRenderer;
  instances: OverlayInstance[];
  renderHud: (instance: OverlayInstance, screenPos: { x: number; y: number }) => React.ReactNode;
  baselineScale?: number;  // default 48
  minScale?: number;       // default 0.4
  maxScale?: number;       // default 2.5
  cullMargin?: number;     // default 100
}

const DEFAULT_BASELINE_SCALE = 48;
const DEFAULT_MIN_SCALE = 0.4;
const DEFAULT_MAX_SCALE = 2.5;
const DEFAULT_CULL_MARGIN = 100;

/**
 * Overlay harness: projects 3D positions to screen space every frame
 * and renders a HUD element for each visible instance.
 *
 * DOM position updates happen imperatively in the RAF loop (not via React state)
 * to avoid re-rendering N components at 60fps.
 */
export function FaceOverlay({
  renderer,
  instances,
  renderHud,
  baselineScale = DEFAULT_BASELINE_SCALE,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
  cullMargin = DEFAULT_CULL_MARGIN,
}: FaceOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const instancesRef = useRef<OverlayInstance[]>(instances);
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

      if (
        projected.x < -cullMargin ||
        projected.x > w + cullMargin ||
        projected.y < -cullMargin ||
        projected.y > h + cullMargin
      ) {
        el.style.display = 'none';
        continue;
      }

      const s = Math.min(maxScale, Math.max(minScale, projected.scale / baselineScale));
      el.style.transform = `translate(${projected.x}px, ${projected.y}px) scale(${s.toFixed(3)})`;
      el.style.display = '';
    }

    rafRef.current = requestAnimationFrame(update);
  }, [renderer, baselineScale, minScale, maxScale, cullMargin]);

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
