import type { FaceRenderer, FaceInstance } from '../../types';
import type { SvgRendererOptions } from '../types';
import { generateFaceSvg } from './generator';

const SVG_NS = 'http://www.w3.org/2000/svg';

const DEFAULTS = {
  faceWidth: 120,
  faceHeight: 160,
};

/**
 * SVG-based FaceRenderer implementation.
 * Same FaceRenderer interface as the FLAME renderer, but uses DOM SVG elements.
 *
 * Each face is an SVG element with ~30 controllable dimensions:
 * - Shape components → head shape, jaw width, brow height, nose width, etc.
 * - Expression components → brow angle, eye openness, mouth shape, etc.
 *
 * CSS hover highlighting via class toggling.
 */
export function createSvgRenderer(options?: SvgRendererOptions): FaceRenderer {
  const opts = { ...DEFAULTS, ...options };
  let container: HTMLElement | null = null;
  let svgRoot: SVGSVGElement | null = null;
  let instances: FaceInstance[] = [];
  let highlightedId: string | null = null;
  const faceElements = new Map<string, SVGGElement>();

  function renderFace(instance: FaceInstance): SVGGElement {
    const g = document.createElementNS(SVG_NS, 'g');
    g.innerHTML = generateFaceSvg(instance.params);
    return g;
  }

  const renderer: FaceRenderer = {
    async init(el: HTMLElement) {
      container = el;
      svgRoot = document.createElementNS(SVG_NS, 'svg');
      svgRoot.setAttribute('width', '100%');
      svgRoot.setAttribute('height', '100%');
      svgRoot.style.position = 'absolute';
      svgRoot.style.top = '0';
      svgRoot.style.left = '0';
      svgRoot.style.overflow = 'visible'; // Allow faces to be partially outside
      container.appendChild(svgRoot);

      // Add basic styles for highlighting
      const style = document.createElement('style');
      style.textContent = `
        .highlighted path, .highlighted ellipse, .highlighted circle, .highlighted rect {
          stroke: #fff;
          stroke-width: 2px;
          filter: drop-shadow(0 0 4px rgba(255,255,255,0.8));
        }
        .dimmed {
          opacity: 0.35;
          filter: grayscale(0.5);
        }
        g[data-face-id] {
          cursor: pointer;
          transition: transform 0.2s ease-out, opacity 0.3s ease;
        }
      `;
      container.appendChild(style);
    },

    setInstances(newInstances: FaceInstance[]) {
      instances = newInstances;
      if (!svgRoot) return;

      // Clear old elements
      faceElements.forEach(el => el.remove());
      faceElements.clear();

      // Get container dimensions for centering
      const rect = container?.getBoundingClientRect() || { width: 800, height: 600 };
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Create new face elements
      for (const inst of instances) {
        const g = renderFace(inst);
        // Position via transform
        // We assume world coordinates where (0,0,0) is center of screen
        // and 1 unit = faceWidth distance approx.
        const [x, y] = inst.position;
        const screenX = centerX + x * opts.faceWidth;
        const screenY = centerY - y * opts.faceHeight; // Flip Y for screen space

        // Offset by half face size to center the SVG face on the position
        const tx = screenX - opts.faceWidth / 2;
        const ty = screenY - opts.faceHeight / 2;

        g.setAttribute('transform', `translate(${tx}, ${ty})`);
        g.dataset.faceId = inst.id;
        svgRoot.appendChild(g);
        faceElements.set(inst.id, g);
      }

      // Re-apply highlight
      if (highlightedId) renderer.highlightInstance(highlightedId);
    },

    highlightInstance(id: string | null) {
      highlightedId = id;
      faceElements.forEach((el, faceId) => {
        el.classList.toggle('highlighted', faceId === id);
        el.classList.toggle('dimmed', id !== null && faceId !== id);
      });
    },

    getInstanceAtScreenPos(x: number, y: number): string | null {
      if (!svgRoot) return null;
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      // Walk up to find the <g> with data-face-id
      let node: Element | null = el;
      while (node && node !== svgRoot) {
        if (node instanceof SVGGElement && node.dataset.faceId) {
          return node.dataset.faceId;
        }
        node = node.parentElement;
      }
      return null;
    },

    selectInstance(_id: string | null) {
      // SVG renderer doesn't support selection ring — no-op
    },

    setCameraTarget(_pos: [number, number, number]) {
      // SVG renderer doesn't have a camera — this is a no-op
    },

    projectToScreen(_worldPos: [number, number, number]) {
      return null; // SVG renderer doesn't have a 3D camera
    },

    dispose() {
      if (svgRoot && container) {
        container.removeChild(svgRoot);
      }
      faceElements.clear();
      svgRoot = null;
      container = null;
    },
  };

  return renderer;
}
