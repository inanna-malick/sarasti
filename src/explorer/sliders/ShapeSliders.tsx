import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ShapeSliders() {
  const width = useExplorerStore(s => s.width);
  const height = useExplorerStore(s => s.height);
  const jaw = useExplorerStore(s => s.jaw);
  const setWidth = useExplorerStore(s => s.setWidth);
  const setHeight = useExplorerStore(s => s.setHeight);
  const setJaw = useExplorerStore(s => s.setJaw);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Shape
      </div>
      <SliderRow label="width" value={width} min={-3} max={3} step={0.01} onChange={setWidth} />
      <SliderRow label="height" value={height} min={-3} max={3} step={0.01} onChange={setHeight} />
      <SliderRow label="jaw" value={jaw} min={-3} max={3} step={0.01} onChange={setJaw} />
    </div>
  );
}
