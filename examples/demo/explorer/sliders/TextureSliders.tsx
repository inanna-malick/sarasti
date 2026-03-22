import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function TextureSliders() {
  const flush = useExplorerStore(s => s.flush);
  const fatigueTex = useExplorerStore(s => s.fatigueTex);
  const setFlush = useExplorerStore(s => s.setFlush);
  const setFatigueTex = useExplorerStore(s => s.setFatigueTex);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Texture
      </div>
      <SliderRow label="flush" value={flush} min={-1} max={1} step={0.01} onChange={setFlush} />
      <SliderRow label="fatigue" value={fatigueTex} min={-1} max={1} step={0.01} onChange={setFatigueTex} />
    </div>
  );
}
