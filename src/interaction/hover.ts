import type { FaceRenderer, FaceInstance } from '../types';
import { useStore } from '../store';

/**
 * Mouse hover → face picking → highlight + tooltip positioning.
 *
 * Listens to mousemove on the container element.
 * On each move (debounced to 16ms):
 *   1. renderer.getInstanceAtScreenPos(x, y) → face id or null
 *   2. renderer.highlightInstance(id) → visual feedback
 *   3. store.setHoveredId(id) → triggers tooltip re-render
 *
 * The tooltip component (Tooltip.tsx) reads hoveredId + instances from store
 * and renders the tooltip overlay. This module only handles the mouse tracking
 * and picking, not the tooltip rendering.
 *
 * Also provides tooltip position data via store so the React tooltip
 * can position itself near the cursor.
 *
 * Usage:
 *   const { dispose } = setupHoverInteraction(container, renderer);
 *   // in cleanup:
 *   dispose();
 */
export interface TooltipPosition {
  x: number;
  y: number;
}

let _tooltipPos: TooltipPosition = { x: 0, y: 0 };

/** Get current tooltip screen position. Called by Tooltip component. */
export function getTooltipPosition(): TooltipPosition {
  return _tooltipPos;
}

export function setupHoverInteraction(
  container: HTMLElement,
  renderer: FaceRenderer,
): { dispose: () => void } {
  let rafPending = false;
  let lastX = 0;
  let lastY = 0;

  function onMouseMove(e: MouseEvent) {
    const rect = container.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    _tooltipPos = { x: e.clientX, y: e.clientY };

    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        const id = renderer.getInstanceAtScreenPos(lastX, lastY);
        renderer.highlightInstance(id);
        useStore.getState().setHoveredId(id);
      });
    }
  }

  function onMouseLeave() {
    renderer.highlightInstance(null);
    useStore.getState().setHoveredId(null);
  }

  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mouseleave', onMouseLeave);

  return {
    dispose() {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      renderer.highlightInstance(null);
    },
  };
}

/**
 * Click face → select for detail panel.
 *
 * Single click selects. Click same face again or click background to deselect.
 * Clicking a face also flies camera to it.
 */
export function setupClickInteraction(
  container: HTMLElement,
  renderer: FaceRenderer,
): { dispose: () => void } {
  function onClick(e: MouseEvent) {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = renderer.getInstanceAtScreenPos(x, y);
    const store = useStore.getState();

    if (id === store.selectedId) {
      // Deselect
      store.setSelectedId(null);
    } else {
      store.setSelectedId(id);
      if (id) {
        // Find instance position and fly camera to it
        const instance = store.instances.find((inst) => inst.id === id);
        if (instance) {
          renderer.setCameraTarget(instance.position);
        }
      }
    }
  }

  container.addEventListener('click', onClick);

  return {
    dispose() {
      container.removeEventListener('click', onClick);
    },
  };
}
