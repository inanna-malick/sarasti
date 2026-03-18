import React, { useEffect, useRef, useState } from 'react';
import type { FaceRenderer } from './types';
import { createFlameSceneRenderer } from './renderer';
import { loadDataset, getFrameAtTime } from './data/loader';
import { FrameDriver } from './timeline/driver';
import { setupHoverInteraction, setupClickInteraction } from './interaction/hover';
import { Tooltip } from './interaction/Tooltip';
import { DetailPanel } from './interaction/detail';
import { TimelineBar } from './ui/TimelineBar';
import { Controls } from './ui/Controls';
import { Landing } from './ui/Landing';
import { useStore } from './store';
import { loadDirectionTables } from './binding/directions';
import { RefineHarness } from './refine/RefineHarness';
import { ExplorerPane } from './explorer/ExplorerPane';

const DATA_URL = '/data/market-data.json';

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FaceRenderer | null>(null);
  const driverRef = useRef<FrameDriver | null>(null);
  const [status, setStatus] = useState<string>('Loading...');
  const [ready, setReady] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const isExplorer = params.get('explorer') === 'true';
  const isRefine = params.get('refine') === 'true';

  useEffect(() => {
    if (isRefine) return;
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

        // 2. Load semantic direction tables
        setStatus('Loading semantic directions...');
        await loadDirectionTables('/data/directions');

        if (disposed) return;

        // 3. Create renderer
        setStatus('Loading FLAME model...');
        const renderer = await createFlameSceneRenderer();
        await renderer.init(containerRef.current!);
        rendererRef.current = renderer;

        if (disposed) return;

        // 4. Create frame driver (wires engine → data → binding → renderer)
        // If ?t= query param is set, start at that timestamp
        let initialIndex = 0;
        const params = new URLSearchParams(window.location.search);
        const targetTime = params.get('t');
        if (targetTime && dataset.frames.length > 0) {
          const targetFrame = getFrameAtTime(dataset, targetTime);
          initialIndex = dataset.frames.indexOf(targetFrame);
          if (initialIndex < 0) initialIndex = 0;
        }

        const driver = new FrameDriver(dataset, renderer, initialIndex);
        driverRef.current = driver;

        // 5. Setup interactions
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

  const handleLoopChange = (loop: boolean) => {
    driverRef.current?.setLoop(loop);
  };

  const handleLandingStart = () => {
    useStore.getState().setShowLanding(false);
    driverRef.current?.play();
  };

  if (isExplorer) {
    return <ExplorerPane />;
  }

  if (isRefine) {
    return <RefineHarness />;
  }

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
          <Controls
            onLoopChange={handleLoopChange}
          />
          <Tooltip />
          <DetailPanel />
        </>
      )}
    </div>
  );
}
