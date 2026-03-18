import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';
import { MAX_EYE_HORIZONTAL, MAX_EYE_VERTICAL } from '@/constants';

export function GazeSliders() {
  const gazeOverride = useExplorerStore(s => s.gazeOverride);
  const gazeHorizontal = useExplorerStore(s => s.gazeHorizontal);
  const gazeVertical = useExplorerStore(s => s.gazeVertical);
  const setGazeOverride = useExplorerStore(s => s.setGazeOverride);
  const setGazeHorizontal = useExplorerStore(s => s.setGazeHorizontal);
  const setGazeVertical = useExplorerStore(s => s.setGazeVertical);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
          Gaze
        </span>
        <label style={{ fontSize: 10, color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={gazeOverride}
            onChange={e => setGazeOverride(e.target.checked)}
            style={{ accentColor: '#6cf' }}
          />
          override
        </label>
      </div>
      <div style={{ opacity: gazeOverride ? 1 : 0.4, pointerEvents: gazeOverride ? 'auto' : 'none' }}>
        <SliderRow label="horizontal" value={gazeHorizontal} min={-MAX_EYE_HORIZONTAL} max={MAX_EYE_HORIZONTAL} step={0.001} onChange={setGazeHorizontal} />
        <SliderRow label="vertical" value={gazeVertical} min={-MAX_EYE_VERTICAL} max={MAX_EYE_VERTICAL} step={0.001} onChange={setGazeVertical} />
      </div>
    </div>
  );
}
