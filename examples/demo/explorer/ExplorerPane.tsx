import React, { useEffect } from 'react';
import { sol, theme } from '../theme';
import { ExplorerRenderer } from './ExplorerRenderer';
import { ExpressionSliders } from './sliders/ExpressionSliders';
import { SemanticSliders } from './sliders/SemanticSliders';
import { ShapeSliders } from './sliders/ShapeSliders';
import { PoseSliders } from './sliders/PoseSliders';
import { GazeSliders } from './sliders/GazeSliders';
import { TextureSliders } from './sliders/TextureSliders';
import { RawSliders } from './sliders/RawSliders';
import { ReportPanel } from './ReportPanel';
import { useExplorerStore } from './store';
import { loadDataset, getFrameIndexAtTime } from '../../../src/data/loader';
import { resolve } from '../../../src/binding/resolve';
import { computeCircumplex } from '../../../src/binding/chords';
import { computeDatasetStats } from '../../../src/data/stats';
import { TICKERS, TICKER_MAP } from '../tickers';

declare global {
  interface Window {
    __RENDER_METADATA?: Record<string, unknown>;
  }
}

export type CameraPreset = 'front' | 'left34' | 'right34' | 'closeup' | 'closeup_eyes' | 'closeup_mouth';

async function loadDataMode(tickerId: string, timestamp: string) {
  const store = useExplorerStore.getState();
  const ticker = TICKER_MAP.get(tickerId);
  if (!ticker) {
    console.error(`[data mode] Unknown ticker: ${tickerId}`);
    window.__EXPLORER_READY = true;
    return;
  }

  const dataset = await loadDataset('/data/market-data.json', TICKERS);
  const stats = computeDatasetStats(dataset);
  const frameIdx = getFrameIndexAtTime(dataset, timestamp);
  const frame = dataset.frames[frameIdx];
  const tickerFrame = frame.values[tickerId];

  if (!tickerFrame) {
    console.error(`[data mode] No data for ticker ${tickerId} at frame ${frameIdx}`);
    window.__EXPLORER_READY = true;
    return;
  }

  const faceParams = resolve(ticker, tickerFrame, undefined, stats);
  store.setCurrentParams(faceParams);
  store.setDataModeContext(tickerId, tickerFrame, ticker, stats);

  // Compute metadata for sidecar output
  const activations = computeCircumplex(tickerFrame, stats, tickerId);

  window.__RENDER_METADATA = {
    ticker: tickerId,
    timestamp: frame.timestamp,
    activations,
    rawSignals: {
      dev: tickerFrame.deviation,
      vel: tickerFrame.velocity,
      vol: tickerFrame.volatility,
      mom: tickerFrame.momentum,
      dd: tickerFrame.drawdown,
      mr_z: tickerFrame.mean_reversion_z,
    },
    texture: {
      flush: faceParams.flush,
      fatigue: faceParams.fatigue,
      skinAge: faceParams.skinAge,
    },
  };

  // Signal ready after data is loaded and params are set.
  // In data mode, ExplorerRenderer defers its ready signal until this fires.
  window.__EXPLORER_READY = true;
}

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const store = useExplorerStore.getState();

  // Debug material mode
  const debugMat = params.get('debug_material');
  if (debugMat === 'skin_xray' || debugMat === 'eyes_only' || debugMat === 'mouth_only') {
    store.setDebugMaterial(debugMat);
  }

  if (params.get('mode') === 'data') {
    store.setMode('data');
    const tickerId = params.get('ticker');
    const timestamp = params.get('t');
    if (tickerId && timestamp) {
      loadDataMode(tickerId, timestamp);
    } else {
      console.error('[data mode] Missing ticker or t param');
    }
    return;
  }

  if (params.get('mode') === 'raw') {
    store.setMode('raw');
    for (let i = 0; i < 50; i++) {
      const v = params.get(`psi${i}`);
      if (v) store.setRawExpression(i, parseFloat(v));
    }
    for (let i = 0; i < 100; i++) {
      const v = params.get(`beta${i}`);
      if (v) store.setRawShape(i, parseFloat(v));
    }
    // Pose overrides
    const pitch = params.get('pitch');
    const yaw = params.get('yaw');
    const roll = params.get('roll');
    const jaw = params.get('jaw');
    if (pitch || yaw || roll || jaw) {
      store.setPoseOverride(true);
      if (pitch) store.setPitch(parseFloat(pitch));
      if (yaw) store.setYaw(parseFloat(yaw));
      if (roll) store.setRoll(parseFloat(roll));
      if (jaw) store.setJawOpen(parseFloat(jaw));
    }
    // Gaze overrides
    const gazeH = params.get('gazeH');
    const gazeV = params.get('gazeV');
    if (gazeH || gazeV) {
      store.setGazeOverride(true);
      if (gazeH) store.setGazeHorizontal(parseFloat(gazeH));
      if (gazeV) store.setGazeVertical(parseFloat(gazeV));
    }
    // Texture
    const flush = params.get('flush');
    const fatigueTex = params.get('fatigueTex');
    if (flush) store.setFlush(parseFloat(flush));
    if (fatigueTex) store.setFatigueTex(parseFloat(fatigueTex));
  } else {
    const tension = params.get('tension');
    const valence = params.get('valence');
    const stature = params.get('stature');
    if (tension) store.setTension(parseFloat(tension));
    if (valence) store.setValence(parseFloat(valence));
    if (stature) store.setStature(parseFloat(stature));

    // Semantic mode uses same axes
    if (params.get('mode') === 'semantic') {
      store.setMode('semantic');
    }
  }
}

function getCameraPreset(): CameraPreset {
  const params = new URLSearchParams(window.location.search);
  const camera = params.get('camera');
  if (camera === 'left34' || camera === 'right34' || camera === 'closeup' || camera === 'closeup_eyes' || camera === 'closeup_mouth') return camera;
  return 'front';
}

export function ExplorerPane() {
  const params = new URLSearchParams(window.location.search);
  const headless = params.get('headless') === 'true';

  useEffect(() => {
    parseUrlParams();
  }, []);

  if (headless) {
    return (
      <div style={{ position: 'relative', width: 512, height: 512 }}>
        <ExplorerRenderer headless camera={getCameraPreset()} />
      </div>
    );
  }

  return <ExplorerPaneUI />;
}

function ExplorerPaneUI() {
  const mode = useExplorerStore(s => s.mode);
  const setMode = useExplorerStore(s => s.setMode);

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      background: theme.bg,
      color: theme.text,
      fontFamily: 'monospace',
    }}>
      {/* Left: 3D Canvas */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <ExplorerRenderer />
      </div>

      {/* Right: Controls Panel */}
      <div style={{
        width: 360,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${theme.border}`,
        background: theme.bgPanel,
      }}>
        {/* Mode toggle */}
        <div style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <a
            href="/"
            style={{ fontSize: 10, color: theme.textMuted, textDecoration: 'none' }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = theme.text; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = theme.textMuted; }}
          >
            Back
          </a>
          <span style={{ fontSize: 12, color: sol.cyan, fontWeight: 'bold' }}>Explorer</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button
              onClick={() => setMode('highlevel')}
              style={{
                background: mode === 'highlevel' ? 'rgba(42,161,152,0.15)' : 'transparent',
                border: `1px solid ${mode === 'highlevel' ? sol.cyan : theme.border}`,
                color: mode === 'highlevel' ? sol.cyan : theme.textMuted,
                borderRadius: 3, padding: '2px 8px', fontSize: 10,
                fontFamily: 'monospace', cursor: 'pointer',
              }}
            >
              High-Level
            </button>
            <button
              onClick={() => setMode('semantic')}
              style={{
                background: mode === 'semantic' ? 'rgba(42,161,152,0.15)' : 'transparent',
                border: `1px solid ${mode === 'semantic' ? sol.cyan : theme.border}`,
                color: mode === 'semantic' ? sol.cyan : theme.textMuted,
                borderRadius: 3, padding: '2px 8px', fontSize: 10,
                fontFamily: 'monospace', cursor: 'pointer',
              }}
            >
              Semantic
            </button>
            <button
              onClick={() => setMode('raw')}
              style={{
                background: mode === 'raw' ? 'rgba(42,161,152,0.15)' : 'transparent',
                border: `1px solid ${mode === 'raw' ? sol.cyan : theme.border}`,
                color: mode === 'raw' ? sol.cyan : theme.textMuted,
                borderRadius: 3, padding: '2px 8px', fontSize: 10,
                fontFamily: 'monospace', cursor: 'pointer',
              }}
            >
              Raw
            </button>
          </div>
        </div>

        {/* Scrollable slider area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {mode === 'highlevel' ? (
            <>
              <ExpressionSliders />
              <ShapeSliders />
              <ReportPanel />
            </>
          ) : mode === 'semantic' ? (
            <>
              <SemanticSliders />
              <ShapeSliders />
              <ReportPanel />
            </>
          ) : (
            <>
              <PoseSliders />
              <GazeSliders />
              <TextureSliders />
              <RawSliders />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
