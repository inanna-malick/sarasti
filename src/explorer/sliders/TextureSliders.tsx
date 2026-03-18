import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function TextureSliders() {
  const flush = useExplorerStore(s => s.flush);
  const fatigue = useExplorerStore(s => s.fatigue);
  const setFlush = useExplorerStore(s => s.setFlush);
  const setFatigue = useExplorerStore(s => s.setFatigue);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Texture
      </div>
      <SliderRow label="flush" value={flush} min={-1} max={1} step={0.01} onChange={setFlush} />
      <SliderRow label="fatigue" value={fatigue} min={-1} max={1} step={0.01} onChange={setFatigue} />
    </div>
  );
}
