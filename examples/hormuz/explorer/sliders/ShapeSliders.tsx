import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ShapeSliders() {
  const dominance = useExplorerStore(s => s.dominance);
  const predator = useExplorerStore(s => s.predator);
  const setDominance = useExplorerStore(s => s.setDominance);
  const setPredator = useExplorerStore(s => s.setPredator);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Shape
      </div>
      <SliderRow label="dominance" value={dominance} min={-3} max={3} step={0.01} onChange={setDominance} />
      <SliderRow label="predator" value={predator} min={-3} max={3} step={0.01} onChange={setPredator} />
    </div>
  );
}
