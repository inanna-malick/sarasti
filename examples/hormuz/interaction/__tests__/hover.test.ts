/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupHoverInteraction, setupClickInteraction, getTooltipPosition } from '../hover';
import { useStore } from '../../../../src/store';
import type { FaceRenderer } from '../../../../src/types';

describe('interaction/hover.ts', () => {
  let container: HTMLElement;
  let renderer: FaceRenderer;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    container.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
    document.body.appendChild(container);

    renderer = {
      init: vi.fn(),
      setInstances: vi.fn(),
      highlightInstance: vi.fn(),
      getInstanceAtScreenPos: vi.fn(),
      setCameraTarget: vi.fn(),
      dispose: vi.fn(),
    };

    // Reset store
    useStore.getState().setHoveredId(null);
    useStore.getState().setSelectedId(null);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  describe('setupHoverInteraction', () => {
    it('mousemove updates hoveredId and calls highlightInstance', () => {
      const { dispose } = setupHoverInteraction(container, renderer);
      
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 50,
        clientY: 50,
      });
      
      vi.mocked(renderer.getInstanceAtScreenPos).mockReturnValue('face-1');
      
      container.dispatchEvent(mouseEvent);
      
      // Should not have called yet due to rAF
      expect(renderer.highlightInstance).not.toHaveBeenCalled();
      
      vi.runAllTimers();
      
      expect(renderer.getInstanceAtScreenPos).toHaveBeenCalledWith(50, 50);
      expect(renderer.highlightInstance).toHaveBeenCalledWith('face-1');
      expect(useStore.getState().hoveredId).toBe('face-1');
      expect(getTooltipPosition()).toEqual({ x: 50, y: 50 });
      
      dispose();
    });

    it('debounces mousemove to requestAnimationFrame', () => {
      const { dispose } = setupHoverInteraction(container, renderer);
      
      const mouseEvent1 = new MouseEvent('mousemove', { clientX: 10, clientY: 10 });
      const mouseEvent2 = new MouseEvent('mousemove', { clientX: 20, clientY: 20 });
      
      container.dispatchEvent(mouseEvent1);
      container.dispatchEvent(mouseEvent2);
      
      expect(renderer.getInstanceAtScreenPos).not.toHaveBeenCalled();
      
      vi.runAllTimers();
      
      expect(renderer.getInstanceAtScreenPos).toHaveBeenCalledTimes(1);
      expect(renderer.getInstanceAtScreenPos).toHaveBeenCalledWith(20, 20);
      
      dispose();
    });

    it('subsequent mousemove calls again after rAF', () => {
      const { dispose } = setupHoverInteraction(container, renderer);
      
      container.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
      vi.runAllTimers();
      expect(renderer.getInstanceAtScreenPos).toHaveBeenCalledTimes(1);
      
      container.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 20 }));
      vi.runAllTimers();
      expect(renderer.getInstanceAtScreenPos).toHaveBeenCalledTimes(2);
      
      dispose();
    });

    it('mouseleave clears hoveredId and calls highlightInstance(null)', () => {
      const { dispose } = setupHoverInteraction(container, renderer);
      
      useStore.getState().setHoveredId('face-1');
      
      const mouseLeaveEvent = new MouseEvent('mouseleave');
      container.dispatchEvent(mouseLeaveEvent);
      
      expect(renderer.highlightInstance).toHaveBeenCalledWith(null);
      expect(useStore.getState().hoveredId).toBe(null);
      
      dispose();
    });

    it('dispose removes event listeners', () => {
      const addSpy = vi.spyOn(container, 'addEventListener');
      const removeSpy = vi.spyOn(container, 'removeEventListener');
      
      const { dispose } = setupHoverInteraction(container, renderer);
      expect(addSpy).toHaveBeenCalledTimes(2); // mousemove, mouseleave
      
      dispose();
      expect(removeSpy).toHaveBeenCalledTimes(2);
      expect(renderer.highlightInstance).toHaveBeenCalledWith(null);
    });

    it('dispose cleans up highlightInstance', () => {
      const { dispose } = setupHoverInteraction(container, renderer);
      dispose();
      expect(renderer.highlightInstance).toHaveBeenCalledWith(null);
    });
  });

  describe('setupClickInteraction', () => {
    it('click selects face and flies camera', () => {
      const { dispose } = setupClickInteraction(container, renderer);
      
      const instance = { id: 'face-1', position: [1, 2, 3] as [number, number, number] };
      useStore.setState({ instances: [instance as any] });
      
      const clickEvent = new MouseEvent('click', {
        clientX: 50,
        clientY: 50,
      });
      
      vi.mocked(renderer.getInstanceAtScreenPos).mockReturnValue('face-1');
      
      container.dispatchEvent(clickEvent);
      
      expect(useStore.getState().selectedId).toBe('face-1');
      expect(renderer.setCameraTarget).toHaveBeenCalledWith([1, 2, 3]);
      
      dispose();
    });

    it('click same face deselects', () => {
      const { dispose } = setupClickInteraction(container, renderer);
      
      useStore.getState().setSelectedId('face-1');
      
      const clickEvent = new MouseEvent('click', {
        clientX: 50,
        clientY: 50,
      });
      
      vi.mocked(renderer.getInstanceAtScreenPos).mockReturnValue('face-1');
      
      container.dispatchEvent(clickEvent);
      
      expect(useStore.getState().selectedId).toBe(null);
      
      dispose();
    });

    it('click background deselects', () => {
      const { dispose } = setupClickInteraction(container, renderer);
      
      useStore.getState().setSelectedId('face-1');
      
      const clickEvent = new MouseEvent('click', {
        clientX: 50,
        clientY: 50,
      });
      
      vi.mocked(renderer.getInstanceAtScreenPos).mockReturnValue(null);
      
      container.dispatchEvent(clickEvent);
      
      expect(useStore.getState().selectedId).toBe(null);
      
      dispose();
    });

    it('does not fly camera if instance not found in store', () => {
      const { dispose } = setupClickInteraction(container, renderer);
      useStore.setState({ instances: [] });
      vi.mocked(renderer.getInstanceAtScreenPos).mockReturnValue('face-not-found');
      container.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 50 }));
      expect(useStore.getState().selectedId).toBe('face-not-found');
      expect(renderer.setCameraTarget).not.toHaveBeenCalled();
      dispose();
    });

    it('click uses container relative coordinates', () => {
      container.getBoundingClientRect = vi.fn(() => ({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        right: 200,
        bottom: 200,
        x: 100,
        y: 100,
        toJSON: () => {},
      }));
      const { dispose } = setupClickInteraction(container, renderer);
      container.dispatchEvent(new MouseEvent('click', { clientX: 150, clientY: 150 }));
      expect(renderer.getInstanceAtScreenPos).toHaveBeenCalledWith(50, 50);
      dispose();
    });

    it('dispose removes click event listener', () => {
      const removeSpy = vi.spyOn(container, 'removeEventListener');
      const { dispose } = setupClickInteraction(container, renderer);
      dispose();
      expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });
});
