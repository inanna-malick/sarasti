/** @vitest-environment jsdom */
import React, { act } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailPanel } from '../detail';
import { useStore } from '../../../../src/store';
import { makeFaceInstance } from './test-helpers';
import * as dataLoader from '../../../../src/data/loader';

vi.mock('../../../../src/data/loader', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getTickerTimeseries: vi.fn(),
  };
});

describe('interaction/detail.tsx', () => {
  beforeEach(() => {
    // Reset store
    act(() => {
      useStore.setState({
        selectedId: null,
        instances: [],
        dataset: {
          tickers: [],
          frames: [],
          timestamps: [],
          baseline_timestamp: '',
        },
        playback: {
          current_index: 0,
          playing: false,
          speed: 1,
          loop: true,
        },
      });
    });
    
    vi.mocked(dataLoader.getTickerTimeseries).mockReturnValue([]);
  });

  it('renders nothing when no selectedId', () => {
    const { container } = render(<DetailPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when dataset is missing', () => {
    const instance = makeFaceInstance('face-1');
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [instance],
        dataset: null,
      });
    });
    const { container } = render(<DetailPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when instance not found', () => {
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [],
        dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
      });
    });
    const { container } = render(<DetailPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('renders detail info when selectedId is set', () => {
    const instance = makeFaceInstance('face-1', {
      ticker: { id: 'face-1', name: 'Selected Ticker', class: 'energy', family: 'energy-fam', age: 40, tenor_months: 3 }
    });
    
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [instance],
        dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
      });
    });

    vi.mocked(dataLoader.getTickerTimeseries).mockReturnValue([
      instance.frame,
      { ...instance.frame, deviation: 0.2 }
    ]);

    render(<DetailPanel />);
    
    expect(screen.getByText('Selected Ticker')).toBeDefined();
    expect(screen.getByText(/face-1 · energy · energy-fam/)).toBeDefined();
    expect(screen.getByText(/age 40 · tenor 3M/)).toBeDefined();
    expect(screen.getByText(/deviation over time/)).toBeDefined();
  });

  it('renders expression description correctly', () => {
    const instance = makeFaceInstance('face-1', {
      frame: { close: 100, volume: 1000, deviation: 0.15, velocity: -0.2, volatility: 1.5, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 }
    });
    
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [instance],
        dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
      });
    });

    render(<DetailPanel />);
    
    expect(screen.getByText(/Positive Surge — 15% above baseline/)).toBeDefined();
    expect(screen.getByText(/Rapid decline indicates market pressure/)).toBeDefined();
    expect(screen.getByText(/Elevated volatility detected/)).toBeDefined();
  });

  it('renders family members', () => {
    const mainInstance = makeFaceInstance('face-1', {
      ticker: { id: 'face-1', name: 'Main', class: 'energy', family: 'fam-a', age: 30 }
    });
    const familyMember = makeFaceInstance('face-2', {
      ticker: { id: 'face-2', name: 'Cousin', class: 'energy', family: 'fam-a', age: 25 },
      frame: { close: 100, volume: 1000, deviation: -0.06, velocity: 0, volatility: 1, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 }
    });
    
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [mainInstance, familyMember],
        dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
      });
    });

    render(<DetailPanel />);
    
    expect(screen.getByText(/family: fam-a/)).toBeDefined();
    expect(screen.getByText('Cousin')).toBeDefined();
    expect(screen.getByText(/-6.0%/)).toBeDefined();
  });

  it('close button clears selectedId', () => {
    const instance = makeFaceInstance('face-1');
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [instance],
        dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
      });
    });

    render(<DetailPanel />);
    
    const closeButton = screen.getByText('×');
    act(() => {
      fireEvent.click(closeButton);
    });
    
    expect(useStore.getState().selectedId).toBe(null);
  });

  it('handles sparkline edge cases (empty data)', () => {
    const instance = makeFaceInstance('face-1');
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [instance],
        dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
      });
    });
    
    vi.mocked(dataLoader.getTickerTimeseries).mockReturnValue([]);

    const { container } = render(<DetailPanel />);
    // Sparkline SVG should not render (no data), but axis bar SVGs will exist
    expect(container.querySelector('svg polyline')).toBeNull();
  });

  it('sparkline renders polyline and current position marker', () => {
    const instance = makeFaceInstance('face-1');
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [instance],
        dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
        playback: { current_index: 1, playing: false, speed: 1, loop: true },
      });
    });
    
    vi.mocked(dataLoader.getTickerTimeseries).mockReturnValue([
      { ...instance.frame, deviation: 0 },
      { ...instance.frame, deviation: 1 },
      { ...instance.frame, deviation: 0.5 },
    ]);

    const { container } = render(<DetailPanel />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.querySelector('polyline')).toBeDefined();
    
    // cursorX should be at index 1 of 2 intervals (3 points) -> width * (1/2) = 144
    const marker = svg?.querySelectorAll('line')[1]; // second line is position marker
    expect(marker?.getAttribute('x1')).toBe('144');
  });

  it('sparkline handles flat data (min == max)', () => {
    const instance = makeFaceInstance('face-1');
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [instance],
        dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
      });
    });
    
    // All values same
    vi.mocked(dataLoader.getTickerTimeseries).mockReturnValue([
      instance.frame,
      instance.frame,
      instance.frame,
    ]);

    const { container } = render(<DetailPanel />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    // Should not crash when dividing by range (range becomes 1 if 0)
    expect(svg?.querySelector('polyline')).toBeDefined();
  });

  it('sparkline handles undefined values in timeseries', () => {
    const instance = makeFaceInstance('face-1');
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [instance],
        dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
      });
    });
    
    vi.mocked(dataLoader.getTickerTimeseries).mockReturnValue([
      instance.frame,
      undefined,
      instance.frame,
    ]);

    const { container } = render(<DetailPanel />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    // Should use 0 for undefined deviation
    expect(svg?.querySelector('polyline')).toBeDefined();
  });

  it('updates when current_index changes', () => {
    const instance = makeFaceInstance('face-1');
    const { rerender } = render(<DetailPanel />);
    
    act(() => {
      useStore.setState({
        selectedId: 'face-1',
        instances: [instance],
        dataset: { tickers: [], frames: [], timestamps: [], baseline_timestamp: '' },
        playback: { current_index: 0, playing: false, speed: 1, loop: true },
      });
    });
    
    vi.mocked(dataLoader.getTickerTimeseries).mockReturnValue([
      instance.frame,
      instance.frame,
    ]);
    
    rerender(<DetailPanel />);
    
    const marker0 = document.querySelectorAll('line')[1];
    expect(marker0.getAttribute('x1')).toBe('0');
    
    act(() => {
      useStore.setState({
        playback: { current_index: 1, playing: false, speed: 1, loop: true },
      });
    });
    
    rerender(<DetailPanel />);
    const marker1 = document.querySelectorAll('line')[1];
    expect(marker1.getAttribute('x1')).toBe('288');
  });
});
