import React, { useEffect, useRef, useState } from 'react';
import type { FaceRenderer } from '../../src/types';
import { createFlameSceneRenderer } from '../../src/renderer';
import { RefineHarness } from './refine/RefineHarness';
import { ExplorerPane } from './explorer/ExplorerPane';

// Episode imports
import type { Episode } from '../../src/episode/types';
import { EPISODES, EPISODE_MAP } from '../../src/episode/episodes';
import { loadDataset } from '../../src/data/loader';
import { FrameDriver } from '../../src/timeline/driver';
import { ScenarioSelector } from './ui/ScenarioSelector';
import { ScenarioOverlay } from './ui/ScenarioOverlay';
import { Tooltip } from './interaction/Tooltip';
import { DetailPanel } from './interaction/detail';
import { TickerList } from './interaction/TickerList';
import { FaceOverlay } from './interaction/FaceOverlay';
import { FaceHud } from './interaction/FaceHud';
import { setupHoverInteraction, setupClickInteraction } from './interaction/hover';
import { useStore } from '../../src/store';

type Mode = 'selector' | 'episode';

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FaceRenderer | null>(null);
  const driverRef = useRef<FrameDriver | null>(null);
  const interactionRef = useRef<{ dispose: () => void }[]>([]);

  // Derive initial mode from URL hash: #/episode/<id>
  const parseHash = (): { mode: Mode; episodeId: string | null } => {
    const match = window.location.hash.match(/^#\/episode\/(.+)$/);
    if (match && EPISODE_MAP[match[1]]) {
      return { mode: 'episode', episodeId: match[1] };
    }
    return { mode: 'selector', episodeId: null };
  };

  const initial = parseHash();
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(
    initial.episodeId ? EPISODE_MAP[initial.episodeId] : null,
  );
  const [status, setStatus] = useState<string>('');
  const [ready, setReady] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Read playback state from store (FrameDriver syncs to store)
  const playing = useStore(s => s.playback.playing);
  const loop = useStore(s => s.playback.loop);
  const currentIndex = useStore(s => s.playback.current_index);
  const frameCount = useStore(s => s.frameCount);
  const currentTimestamp = useStore(s => s.currentTimestamp);

  const params = new URLSearchParams(window.location.search);
  const isExplorer = params.get('explorer') === 'true';
  const isRefine = params.get('refine') === 'true';

  // Handle browser back/forward via popstate
  useEffect(() => {
    const onPopState = () => {
      const { mode: hashMode, episodeId } = parseHash();
      if (hashMode === 'selector' && mode === 'episode') {
        tearDown();
        setMode('selector');
      } else if (hashMode === 'episode' && episodeId && mode === 'selector') {
        handleSelectEpisode(EPISODE_MAP[episodeId]);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }); // intentionally no deps — reads current mode via closure

  // Auto-launch episode from initial hash (e.g. direct link to #/episode/covid-crash)
  const initialLaunched = useRef(false);
  useEffect(() => {
    if (initialLaunched.current) return;
    if (initial.mode === 'episode' && initial.episodeId) {
      initialLaunched.current = true;
      handleSelectEpisode(EPISODE_MAP[initial.episodeId]!);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tearDown = () => {
    // Dispose interactions
    for (const i of interactionRef.current) i.dispose();
    interactionRef.current = [];

    driverRef.current?.dispose();
    driverRef.current = null;
    rendererRef.current?.dispose();
    rendererRef.current = null;
    setReady(false);
    setSelectedEpisode(null);

    // Clear store state
    useStore.getState().setHoveredId(null);
    useStore.getState().setSelectedId(null);
    useStore.getState().setFlyToFace(null);
  };

  // Episode selection handler
  const handleSelectEpisode = async (episode: Episode) => {
    setSelectedEpisode(episode);
    setStatus('Loading episode data...');
    setMode('episode');

    // Push hash so browser back returns to selector
    const hashPath = `#/episode/${episode.id}`;
    if (window.location.hash !== hashPath) {
      history.pushState(null, '', hashPath);
    }

    try {
      // Load dataset and renderer in parallel
      const [dataset, renderer] = await Promise.all([
        loadDataset(episode.dataUrl, episode.tickers),
        createFlameSceneRenderer(),
      ]);

      await renderer.init(containerRef.current!);
      rendererRef.current = renderer;

      // Store dataset for detail panel sparklines
      useStore.getState().setDataset(dataset);

      const driver = new FrameDriver(dataset, renderer);
      driverRef.current = driver;

      // Set up hover + click interactions on the viewport
      const container = containerRef.current!;
      const hover = setupHoverInteraction(container, renderer);
      const click = setupClickInteraction(container, renderer);
      interactionRef.current = [hover, click];

      // Wire flyToFace callback for TickerList
      useStore.getState().setFlyToFace((id: string) => {
        const inst = useStore.getState().instances.find((i) => i.id === id);
        if (inst) {
          renderer.setCameraTarget(inst.position);
          renderer.selectInstance(id);
        }
      });

      // Default playback: 4 frames/sec base (= 1 day/sec with 4 frames/day)
      driver.setSpeed(4);
      driver.setLoop(true);

      setStatus('');
      setReady(true);
      driver.play();

      // Select an initial face after first frame renders — gives the view a focal point
      requestAnimationFrame(() => {
        const instances = useStore.getState().instances;
        if (instances.length > 0) {
          // Prefer a fear-class ticker (sentinel) as initial focus, else first
          const sentinel = instances.find((i) => i.ticker.class === 'fear');
          const target = sentinel || instances[0];
          useStore.getState().setSelectedId(target.id);
          renderer.selectInstance(target.id);
        }
      });
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    }
  };

  const handleBackToSelector = () => {
    tearDown();
    setMode('selector');

    // Clear hash — use pushState so forward button works
    if (window.location.hash) {
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
  };

  // Compute progress and duration from store state
  const progress = frameCount > 1 ? currentIndex / (frameCount - 1) : 0;
  const displayTime = currentIndex;
  const displayDuration = frameCount > 0 ? frameCount - 1 : 0;

  if (isExplorer) return <ExplorerPane />;
  if (isRefine) return <RefineHarness />;

  const showSidebars = mode === 'episode' && ready;

  return (
    <div id="app" style={{ width: '100%', height: '100%', display: 'flex', background: '#002b36' }}>
      {/* Left sidebar: ticker list */}
      {showSidebars && <TickerList />}

      {/* Center: viewport + overlays */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        {/* 3D viewport */}
        <div
          id="viewport"
          ref={containerRef}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Episode selector */}
        {mode === 'selector' && (
          <ScenarioSelector episodes={EPISODES} onSelect={handleSelectEpisode} />
        )}

        {/* Episode playback controls — bottom bar only, no click interception */}
        {mode === 'episode' && driverRef.current && selectedEpisode && (
          <ScenarioOverlay
            title={selectedEpisode.title}
            subtitle={selectedEpisode.subtitle}
            progress={progress}
            currentTime={displayTime}
            duration={displayDuration}
            isPlaying={playing}
            speed={speedMultiplier}
            looping={loop}
            timestamp={currentTimestamp}
            onTogglePlay={() => driverRef.current?.togglePlay()}
            onSeek={(frac) => {
              const idx = Math.round(frac * (frameCount - 1));
              driverRef.current?.seek(idx);
            }}
            onSetSpeed={(m) => {
              setSpeedMultiplier(m);
              driverRef.current?.setSpeed(4 * m);
            }}
            onSetLoop={(l) => driverRef.current?.setLoop(l)}
            onBack={handleBackToSelector}
          />
        )}

        {/* Face HUD overlays */}
        {showSidebars && rendererRef.current && (
          <FaceOverlay
            renderer={rendererRef.current}
            renderHud={(instance) => <FaceHud instance={instance} />}
          />
        )}

        {/* Hover tooltip */}
        {showSidebars && <Tooltip />}

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

      {/* Right sidebar: detail panel (always visible, shows empty state) */}
      {showSidebars && <DetailPanel />}
    </div>
  );
}
