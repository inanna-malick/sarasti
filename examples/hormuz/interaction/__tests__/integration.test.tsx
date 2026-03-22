/** @vitest-environment jsdom */
import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from '../Tooltip';
import { DetailPanel } from '../detail';
import { setupHoverInteraction, setupClickInteraction } from '../hover';
import { useStore } from '../../../../src/store';
import { makeFaceInstance } from './test-helpers';
import type { FaceRenderer } from '../../../../src/types';
import * as dataLoader from '../../../../src/data/loader';

vi.mock('../../../../src/data/loader', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getTickerTimeseries: vi.fn(),
  };
});

describe('interaction subsystem integration', () => {
  let container: HTMLElement;
  let renderer: FaceRenderer;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    container.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
      right: 1000,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
    document.body.appendChild(container);

    renderer = {
      init: vi.fn(),
      setInstances: vi.fn(),
      highlightInstance: vi.fn(),
      selectInstance: vi.fn(),
      getInstanceAtScreenPos: vi.fn(),
      setCameraTarget: vi.fn(),
      dispose: vi.fn(),
    };

    // Reset store
    useStore.setState({
      hoveredId: null,
      selectedId: null,
      instances: [],
      dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
      playback: { current_index: 0, playing: false, speed: 1, loop: true },
    });
    
    vi.mocked(dataLoader.getTickerTimeseries).mockReturnValue([]);
    
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 800);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  it('hovering then clicking a face shows tooltip then detail panel', () => {
    const instance = makeFaceInstance('face-1', {
      ticker: { id: 'face-1', name: 'Integrated Face', class: 'fear', family: 'test', age: 50 },
      position: [1, 2, 3] as [number, number, number],
    });
    
    useStore.setState({ instances: [instance] });
    vi.mocked(renderer.getInstanceAtScreenPos).mockReturnValue('face-1');
    vi.mocked(dataLoader.getTickerTimeseries).mockReturnValue([instance.frame, instance.frame]);

    const { dispose: disposeHover } = setupHoverInteraction(container, renderer);
    const { dispose: disposeClick } = setupClickInteraction(container, renderer);

    const { rerender } = render(
      <>
        <Tooltip />
        <DetailPanel />
      </>
    );

    // 1. Mouse move → tooltip shows
    act(() => {
      container.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));
      vi.runAllTimers();
    });
    
    rerender(
      <>
        <Tooltip />
        <DetailPanel />
      </>
    );
    
    expect(screen.getByText('Integrated Face')).toBeDefined();
    expect(screen.queryByText('deviation over time')).toBeNull(); // DetailPanel not open yet

    // 2. Click → DetailPanel shows
    act(() => {
      container.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100 }));
    });
    
    rerender(
      <>
        <Tooltip />
        <DetailPanel />
      </>
    );
    
    expect(screen.getAllByText('Integrated Face').length).toBe(2);
    expect(screen.getByText('deviation over time')).toBeDefined();
    expect(renderer.setCameraTarget).toHaveBeenCalledWith([1, 2, 3]);

    // 3. Mouse leave → tooltip hidden, detail panel remains
    act(() => {
      container.dispatchEvent(new MouseEvent('mouseleave'));
    });
    
    rerender(
      <>
        <Tooltip />
        <DetailPanel />
      </>
    );
    
    // Tooltip should be gone. We can check by verifying only one "Integrated Face" exists (in DetailPanel)
    const titles = screen.getAllByText('Integrated Face');
    expect(titles.length).toBe(1);

    // 4. Close DetailPanel
    const closeButton = screen.getByText('×');
    act(() => {
      fireEvent.click(closeButton);
    });
    
    rerender(
      <>
        <Tooltip />
        <DetailPanel />
      </>
    );
    
    expect(screen.queryByText('Integrated Face')).toBeNull();

    disposeHover();
    disposeClick();
  });
});
