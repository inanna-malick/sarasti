import React from 'react';
import { ExplorerRenderer } from './ExplorerRenderer';
import { ShapeSliders } from './sliders/ShapeSliders';
import { ExpressionSliders } from './sliders/ExpressionSliders';
import { PoseSliders } from './sliders/PoseSliders';
import { GazeSliders } from './sliders/GazeSliders';
import { TextureSliders } from './sliders/TextureSliders';
import { RawSliders } from './sliders/RawSliders';
import { ReportPanel } from './ReportPanel';
import { useExplorerStore } from './store';

export function ExplorerPane() {
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
              <ShapeSliders />
              <ExpressionSliders />
              <PoseSliders />
              <GazeSliders />
              <TextureSliders />
              <ReportPanel />
            </>
          ) : (
            <>
              <PoseSliders />
              <GazeSliders />
              <RawSliders />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
