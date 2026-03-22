import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ShapeSliders() {
  const stature = useExplorerStore(s => s.stature);
  const setStature = useExplorerStore(s => s.setStature);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Shape
      </div>
      <SliderRow label="stature" value={stature} min={-1} max={1} step={0.01} onChange={setStature} />
    </div>
  );
}
