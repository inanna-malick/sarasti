import React, { useEffect, useRef, useState } from 'react';
import type { FaceRenderer, LayoutStrategy } from './types';
import { createFlameSceneRenderer } from './renderer';
import { loadDataset } from './data/loader';
import { FrameDriver } from './timeline/driver';
import { setupHoverInteraction, setupClickInteraction } from './interaction/hover';
import { Tooltip } from './interaction/Tooltip';
import { DetailPanel } from './interaction/detail';
import { TimelineBar } from './ui/TimelineBar';
import { Controls } from './ui/Controls';
import { Landing } from './ui/Landing';
import { useStore } from './store';

const DATA_URL = '/data/market-history.json';

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FaceRenderer | null>(null);
  const driverRef = useRef<FrameDriver | null>(null);
  const [status, setStatus] = useState<string>('Loading...');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let hoverDispose: (() => void) | null = null;
    let clickDispose: (() => void) | null = null;

    async function init() {
      if (!containerRef.current) return;

      try {
        // 1. Load data
        setStatus('Loading market data...');
        const dataset = await loadDataset(DATA_URL);
        useStore.getState().setDataset(dataset);

        if (disposed) return;

        // 2. Create renderer
        setStatus('Loading FLAME model...');
        const renderer = await createFlameSceneRenderer();
        await renderer.init(containerRef.current!);
        rendererRef.current = renderer;

        if (disposed) return;

        // 3. Create frame driver (wires engine → data → binding → renderer)
        const driver = new FrameDriver(dataset, renderer);
        driverRef.current = driver;

        // 4. Setup interactions
        const hover = setupHoverInteraction(containerRef.current!, renderer);
        hoverDispose = hover.dispose;
        const click = setupClickInteraction(containerRef.current!, renderer);
        clickDispose = click.dispose;

        setStatus('');
        setReady(true);
      } catch (err) {
        setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
        console.error(err);
      }
    }

    init();

    return () => {
      disposed = true;
      hoverDispose?.();
      clickDispose?.();
      driverRef.current?.dispose();
      driverRef.current = null;
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Callbacks for UI components
  const handleTogglePlay = () => {
    const driver = driverRef.current;
    if (!driver) return;
    driver.togglePlay();
    useStore.getState().setShowLanding(false);
  };

  const handleSeek = (index: number) => {
    driverRef.current?.seek(index);
  };

  const handleSpeedChange = (speed: number) => {
    driverRef.current?.setSpeed(speed);
  };

  const handleLayoutChange = (strategy: LayoutStrategy) => {
    driverRef.current?.setLayout(strategy);
  };

  const handleLandingStart = () => {
    useStore.getState().setShowLanding(false);
    driverRef.current?.play();
  };

  return (
    <div id="app" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 3D viewport */}
      <div
        id="viewport"
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Loading status */}
      {status && (
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
      )}

      {/* UI overlay */}
      {ready && (
        <>
          <Landing onStart={handleLandingStart} />
          <TimelineBar
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onSpeedChange={handleSpeedChange}
          />
          <Controls onLayoutChange={handleLayoutChange} />
          <Tooltip />
          <DetailPanel />
        </>
      )}
    </div>
  );
}
