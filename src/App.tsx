import React, { useEffect, useRef, useState } from 'react';
import type { FaceRenderer, FaceInstance, TimelineDataset, Frame } from './types';
import { createFlameSceneRenderer } from './renderer';
import { loadDataset, getFrameAtTime } from './data/loader';
import { createResolver } from './binding/resolve';
import { computeLayout } from './spatial/layout';

const DATA_URL = '/data/market-history.json';

/** Build FaceInstance[] from a dataset, frame, and layout positions. */
function buildInstances(
  dataset: TimelineDataset,
  frame: Frame,
  positions: Map<string, [number, number, number]>,
): FaceInstance[] {
  const resolver = createResolver();
  const instances: FaceInstance[] = [];

  for (const ticker of dataset.tickers) {
    const tickerFrame = frame.values[ticker.id];
    if (!tickerFrame) continue;

    const pos = positions.get(ticker.id);
    if (!pos) continue;

    const params = resolver.resolve(ticker, tickerFrame);

    instances.push({
      id: ticker.id,
      params,
      position: pos,
      ticker,
      frame: tickerFrame,
    });
  }

  return instances;
}

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FaceRenderer | null>(null);
  const [status, setStatus] = useState<string>('Loading...');
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    let disposed = false;

    async function init() {
      if (!containerRef.current) return;

      try {
        // 1. Load data
        setStatus('Loading market data...');
        const dataset = await loadDataset(DATA_URL);

        if (disposed) return;

        // 2. Compute layout
        const layout = computeLayout(dataset.tickers, { kind: 'family-rows' });

        // 3. Create renderer
        setStatus('Loading FLAME model...');
        const renderer = await createFlameSceneRenderer();
        await renderer.init(containerRef.current!);
        rendererRef.current = renderer;

        if (disposed) return;

        // 4. Render at strike onset: Feb 28 00:00 UTC
        const targetTime = '2026-02-28T00:00:00Z';
        const frame = getFrameAtTime(dataset, targetTime);
        const instances = buildInstances(dataset, frame, layout.positions);

        renderer.setInstances(instances);
        setTimestamp(frame.timestamp);
        setStatus(`${instances.length} faces at ${frame.timestamp}`);
      } catch (err) {
        setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
        console.error(err);
      }
    }

    init();

    return () => {
      disposed = true;
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  return (
    <div id="app" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        id="viewport"
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        color: '#888',
        fontFamily: 'monospace',
        fontSize: 13,
        pointerEvents: 'none',
      }}>
        {status}
      </div>
    </div>
  );
}
