import React, { useEffect } from 'react';
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

export type CameraPreset = 'front' | 'left34' | 'right34' | 'closeup' | 'closeup_eyes';

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const store = useExplorerStore.getState();

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
    const alarm = params.get('alarm');
    const fatigue = params.get('fatigue');
    const aggression = params.get('aggression');
    const dominance = params.get('dominance');
    const maturity = params.get('maturity');
    if (alarm) store.setAlarm(parseFloat(alarm));
    if (fatigue) store.setFatigue(parseFloat(fatigue));
    if (aggression) store.setAggression(parseFloat(aggression));
    if (dominance) store.setDominance(parseFloat(dominance));
    if (maturity) store.setMaturity(parseFloat(maturity));
    const sharpness = params.get('sharpness');
    if (sharpness) store.setSharpness(parseFloat(sharpness));

    // Semantic mode params
    if (params.get('mode') === 'semantic') {
      store.setMode('semantic');
      const distress = params.get('distress');
      const vitality = params.get('vitality');
      const metaAggression = params.get('metaAggression');
      if (distress) store.setDistress(parseFloat(distress));
      if (vitality) store.setVitality(parseFloat(vitality));
      if (metaAggression) store.setMetaAggression(parseFloat(metaAggression));
    }
  }
}

function getCameraPreset(): CameraPreset {
  const params = new URLSearchParams(window.location.search);
  const camera = params.get('camera');
  if (camera === 'left34' || camera === 'right34' || camera === 'closeup' || camera === 'closeup_eyes') return camera;
  return 'front';
}

export function ExplorerPane() {
  const params = new URLSearchParams(window.location.search);
  const headless = params.get('headless') === 'true';

  useEffect(() => {
    parseUrlParams();
  }, []);

  if (headless) {
    return <ExplorerRenderer headless camera={getCameraPreset()} />;
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
      background: '#111',
      color: '#ccc',
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
        borderLeft: '1px solid #333',
        background: '#1a1a1a',
      }}>
        {/* Mode toggle */}
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid #333',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <a
            href="/"
            style={{ fontSize: 10, color: '#888', textDecoration: 'none' }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#ccc'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#888'; }}
          >
            Back
          </a>
          <span style={{ fontSize: 12, color: '#6cf', fontWeight: 'bold' }}>Explorer</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button
              onClick={() => setMode('highlevel')}
              style={{
                background: mode === 'highlevel' ? '#334' : 'transparent',
                border: `1px solid ${mode === 'highlevel' ? '#6cf' : '#444'}`,
                color: mode === 'highlevel' ? '#6cf' : '#888',
                borderRadius: 3, padding: '2px 8px', fontSize: 10,
                fontFamily: 'monospace', cursor: 'pointer',
              }}
            >
              High-Level
            </button>
            <button
              onClick={() => setMode('semantic')}
              style={{
                background: mode === 'semantic' ? '#334' : 'transparent',
                border: `1px solid ${mode === 'semantic' ? '#6cf' : '#444'}`,
                color: mode === 'semantic' ? '#6cf' : '#888',
                borderRadius: 3, padding: '2px 8px', fontSize: 10,
                fontFamily: 'monospace', cursor: 'pointer',
              }}
            >
              Semantic
            </button>
            <button
              onClick={() => setMode('raw')}
              style={{
                background: mode === 'raw' ? '#334' : 'transparent',
                border: `1px solid ${mode === 'raw' ? '#6cf' : '#444'}`,
                color: mode === 'raw' ? '#6cf' : '#888',
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
