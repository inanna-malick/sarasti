import React, { useEffect, useRef, useState } from 'react';
import type { FaceRenderer } from '../../src/types';
import { createFlameSceneRenderer } from '../../src/renderer';
import { RefineHarness } from './refine/RefineHarness';
import { ExplorerPane } from './explorer/ExplorerPane';

// Scenario imports
import type { Scenario } from '../../src/scenario/types';
import { ScenarioDriver } from '../../src/scenario/driver';
import { ScenarioSelector } from './ui/ScenarioSelector';
import { ScenarioOverlay } from './ui/ScenarioOverlay';
import {
  CRASH_SCENARIO,
  BLEED_SCENARIO,
  DIVERGENCE_SCENARIO,
  FALSE_CALM_SCENARIO,
} from '../../src/scenario/scenarios';

const SCENARIOS = [
  CRASH_SCENARIO,
  BLEED_SCENARIO,
  DIVERGENCE_SCENARIO,
  FALSE_CALM_SCENARIO,
];

type Mode = 'selector' | 'scenario';

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FaceRenderer | null>(null);
  const scenarioDriverRef = useRef<ScenarioDriver | null>(null);

  const [mode, setMode] = useState<Mode>('selector');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [status, setStatus] = useState<string>('');
  const [ready, setReady] = useState(false);
  const [playbackUpdate, setPlaybackUpdate] = useState(0);

  const params = new URLSearchParams(window.location.search);
  const isExplorer = params.get('explorer') === 'true';
  const isRefine = params.get('refine') === 'true';

  // Sync scenario playback state to React for smooth UI updates
  useEffect(() => {
    if (mode !== 'scenario') return;
    let rafId: number;
    const loop = () => {
      if (scenarioDriverRef.current?.isPlaying) {
        setPlaybackUpdate(u => u + 1);
      }
      rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafId);
  }, [mode]);

  // Scenario selection handler
  const handleSelectScenario = async (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setStatus('Initializing scenario...');
    setMode('scenario');

    try {
      const renderer = await createFlameSceneRenderer();
      await renderer.init(containerRef.current!);
      rendererRef.current = renderer;

      const driver = new ScenarioDriver(scenario, renderer);
      scenarioDriverRef.current = driver;

      driver.onEvent(() => setPlaybackUpdate(u => u + 1));

      setStatus('');
      setReady(true);
      driver.play();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    }
  };

  const handleBackToSelector = () => {
    scenarioDriverRef.current?.dispose();
    scenarioDriverRef.current = null;
    rendererRef.current?.dispose();
    rendererRef.current = null;
    setReady(false);
    setSelectedScenario(null);
    setMode('selector');
  };

  if (isExplorer) return <ExplorerPane />;
  if (isRefine) return <RefineHarness />;

  return (
    <div id="app" style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      {/* 3D viewport */}
      <div
        id="viewport"
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Scenario selector */}
      {mode === 'selector' && (
        <ScenarioSelector scenarios={SCENARIOS} onSelect={handleSelectScenario} />
      )}

      {/* Scenario playback */}
      {mode === 'scenario' && scenarioDriverRef.current && selectedScenario && (
        <ScenarioOverlay
          title={selectedScenario.title}
          subtitle={selectedScenario.subtitle}
          progress={scenarioDriverRef.current.progress}
          currentTime={scenarioDriverRef.current.currentTime}
          duration={scenarioDriverRef.current.duration}
          isPlaying={scenarioDriverRef.current.isPlaying}
          speed={scenarioDriverRef.current.speed}
          looping={scenarioDriverRef.current.looping}
          onTogglePlay={() => {
            scenarioDriverRef.current?.togglePlay();
            setPlaybackUpdate(u => u + 1);
          }}
          onSeek={(frac) => {
            scenarioDriverRef.current?.seekNormalized(frac);
            setPlaybackUpdate(u => u + 1);
          }}
          onSetSpeed={(m) => {
            scenarioDriverRef.current?.setSpeed(m);
            setPlaybackUpdate(u => u + 1);
          }}
          onSetLoop={(l) => {
            scenarioDriverRef.current?.setLoop(l);
            setPlaybackUpdate(u => u + 1);
          }}
          onBack={handleBackToSelector}
        />
      )}

      {/* Status display */}
      {status && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          color: '#888',
          fontFamily: 'monospace',
          fontSize: 13,
          pointerEvents: 'none',
          zIndex: 1000,
        }}>
          {status}
        </div>
      )}
    </div>
  );
}
