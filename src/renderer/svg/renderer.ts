import type { FaceRenderer, FaceInstance } from '../../types';
import type { SvgRendererOptions } from '../types';

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

  function renderFace(_instance: FaceInstance): SVGGElement {
    const g = document.createElementNS(SVG_NS, 'g');
    // Stub — svg Dev will implement the 30+ controllable face dimensions
    // mapping shape[] → head geometry and expression[] → facial features
    const placeholder = document.createElementNS(SVG_NS, 'ellipse');
    placeholder.setAttribute('cx', String(opts.faceWidth / 2));
    placeholder.setAttribute('cy', String(opts.faceHeight / 2));
    placeholder.setAttribute('rx', String(opts.faceWidth * 0.4));
    placeholder.setAttribute('ry', String(opts.faceHeight * 0.45));
    placeholder.setAttribute('fill', '#c8b8a8');
    placeholder.setAttribute('stroke', '#666');
    g.appendChild(placeholder);
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
      container.appendChild(svgRoot);
    },

    setInstances(newInstances: FaceInstance[]) {
      instances = newInstances;
      if (!svgRoot) return;

      // Clear old elements
      faceElements.forEach(el => el.remove());
      faceElements.clear();

      // Create new face elements
      for (const inst of instances) {
        const g = renderFace(inst);
        // Position via transform (world coords → screen coords done externally)
        const [x, y] = inst.position;
        g.setAttribute('transform', `translate(${x * opts.faceWidth}, ${y * opts.faceHeight})`);
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

    setCameraTarget(_pos: [number, number, number]) {
      // SVG renderer doesn't have a camera — this is a no-op
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
