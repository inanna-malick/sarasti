import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ShapeSliders() {
  const stature = useExplorerStore(s => s.stature);
  const proportion = useExplorerStore(s => s.proportion);
  const angularity = useExplorerStore(s => s.angularity);
  const setStature = useExplorerStore(s => s.setStature);
  const setProportion = useExplorerStore(s => s.setProportion);
  const setAngularity = useExplorerStore(s => s.setAngularity);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Shape
      </div>
      <SliderRow label="stature" value={stature} min={-3} max={3} step={0.01} onChange={setStature} />
      <SliderRow label="proportion" value={proportion} min={-3} max={3} step={0.01} onChange={setProportion} />
      <SliderRow label="angularity" value={angularity} min={-3} max={3} step={0.01} onChange={setAngularity} />
    </div>
  );
}
