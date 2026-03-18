/** @vitest-environment jsdom */
import React, { act } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip } from '../Tooltip';
import { useStore } from '../../store';
import { makeFaceInstance } from './test-helpers';
import * as hoverModule from '../hover';

vi.mock('../hover', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getTooltipPosition: vi.fn(() => ({ x: 0, y: 0 })),
  };
});

describe('interaction/Tooltip.tsx', () => {
  beforeEach(() => {
    // Reset store
    act(() => {
      useStore.setState({
        hoveredId: null,
        instances: [],
      });
    });
    
    // Mock window dimensions
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 800);
    
    vi.mocked(hoverModule.getTooltipPosition).mockReturnValue({ x: 0, y: 0 });
  });

  it('renders nothing when no hoveredId', () => {
    const { container } = render(<Tooltip />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when instance not found', () => {
    act(() => {
      useStore.setState({
        hoveredId: 'non-existent',
        instances: [],
      });
    });
    const { container } = render(<Tooltip />);
    expect(container.firstChild).toBeNull();
  });

  it('renders ticker info when hoveredId is set', () => {
    const instance = makeFaceInstance('face-1', {
      ticker: { id: 'face-1', name: 'Test Energy', class: 'energy', family: 'energy-fam', age: 30 }
    });
    
    act(() => {
      useStore.setState({
        hoveredId: 'face-1',
        instances: [instance],
      });
    });

    render(<Tooltip />);
    
    expect(screen.getByText('Test Energy')).toBeDefined();
    expect(screen.getByText(/face-1 · energy · energy-fam/)).toBeDefined();
    expect(screen.getByText(/age 30/)).toBeDefined();
  });

  it('renders frame values with correct color for negative deviation', () => {
    const instance = makeFaceInstance('face-1', {
      frame: { close: 123.45, volume: 1000, deviation: -0.1, velocity: 0.01, volatility: 2.0, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 }
    });
    
    act(() => {
      useStore.setState({
        hoveredId: 'face-1',
        instances: [instance],
      });
    });

    render(<Tooltip />);
    
    expect(screen.getByText('123.45')).toBeDefined();
    expect(screen.getByText('-10.0%')).toBeDefined();
    
    const devElement = screen.getByText('-10.0%');
    expect(devElement.style.color).toBe('rgb(255, 107, 107)'); // #ff6b6b
  });

  it('renders frame values with correct color for positive deviation', () => {
    const instance = makeFaceInstance('face-1', {
      frame: { close: 100, volume: 1000, deviation: 0.1, velocity: 0, volatility: 1, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 }
    });
    
    act(() => {
      useStore.setState({
        hoveredId: 'face-1',
        instances: [instance],
      });
    });

    render(<Tooltip />);
    
    const devElement = screen.getByText('+10.0%');
    expect(devElement.style.color).toBe('rgb(81, 207, 102)'); // #51cf66
  });

  it('renders frame values with correct color for neutral deviation', () => {
    const instance = makeFaceInstance('face-1', {
      frame: { close: 100, volume: 1000, deviation: 0.01, velocity: 0, volatility: 1, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 }
    });
    
    act(() => {
      useStore.setState({
        hoveredId: 'face-1',
        instances: [instance],
      });
    });

    render(<Tooltip />);
    
    const devElement = screen.getByText('+1.0%');
    expect(devElement.style.color).toBe('rgb(136, 136, 136)'); // #888
  });

  it('handles tenor_months if present', () => {
    const instance = makeFaceInstance('face-1', {
      ticker: { id: 'face-1', name: 'Tenor Test', class: 'energy', family: 'fam', age: 30, tenor_months: 6 }
    });
    
    act(() => {
      useStore.setState({
        hoveredId: 'face-1',
        instances: [instance],
      });
    });

    render(<Tooltip />);
    expect(screen.getByText(/6M/)).toBeDefined();
  });

  it('positions itself and avoids overflow (right edge)', () => {
    const instance = makeFaceInstance('face-1');
    act(() => {
      useStore.setState({
        hoveredId: 'face-1',
        instances: [instance],
      });
    });

    vi.mocked(hoverModule.getTooltipPosition).mockReturnValue({ x: 950, y: 400 });

    const { container } = render(<Tooltip />);
    const tooltip = container.firstChild as HTMLElement;
    
    expect(tooltip.style.left).toBe('654px');
  });

  it('positions itself and avoids overflow (bottom edge)', () => {
    const instance = makeFaceInstance('face-1');
    act(() => {
      useStore.setState({
        hoveredId: 'face-1',
        instances: [instance],
      });
    });

    vi.mocked(hoverModule.getTooltipPosition).mockReturnValue({ x: 100, y: 750 });

    const { container } = render(<Tooltip />);
    const tooltip = container.firstChild as HTMLElement;
    
    // pos.y - tooltipHeight - offsetY = 750 - 200 - 16 = 534
    expect(tooltip.style.top).toBe('534px');
  });

  it('positions itself and avoids overflow (both right and bottom edges)', () => {
    const instance = makeFaceInstance('face-1');
    act(() => {
      useStore.setState({
        hoveredId: 'face-1',
        instances: [instance],
      });
    });

    vi.mocked(hoverModule.getTooltipPosition).mockReturnValue({ x: 950, y: 750 });

    const { container } = render(<Tooltip />);
    const tooltip = container.firstChild as HTMLElement;
    
    expect(tooltip.style.left).toBe('654px');
    expect(tooltip.style.top).toBe('534px');
  });

  it('default position when not overflowing', () => {
    const instance = makeFaceInstance('face-1');
    act(() => {
      useStore.setState({
        hoveredId: 'face-1',
        instances: [instance],
      });
    });

    vi.mocked(hoverModule.getTooltipPosition).mockReturnValue({ x: 100, y: 100 });

    const { container } = render(<Tooltip />);
    const tooltip = container.firstChild as HTMLElement;
    
    // pos.x + offsetX = 100 + 16 = 116
    // pos.y + offsetY = 100 + 16 = 116
    expect(tooltip.style.left).toBe('116px');
    expect(tooltip.style.top).toBe('116px');
  });
});
