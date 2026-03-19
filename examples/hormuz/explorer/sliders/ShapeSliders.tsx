import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ShapeSliders() {
  const dominance = useExplorerStore(s => s.dominance);
  const setDominance = useExplorerStore(s => s.setDominance);
  const maturity = useExplorerStore(s => s.maturity);
  const setMaturity = useExplorerStore(s => s.setMaturity);
  const sharpness = useExplorerStore(s => s.sharpness);
  const setSharpness = useExplorerStore(s => s.setSharpness);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Shape
      </div>
      <SliderRow label="dominance" value={dominance} min={-1} max={1} step={0.01} onChange={setDominance} />
      <SliderRow label="maturity" value={maturity} min={-1} max={1} step={0.01} onChange={setMaturity} />
      <SliderRow label="sharpness" value={sharpness} min={-1} max={1} step={0.01} onChange={setSharpness} />
    </div>
  );
}
