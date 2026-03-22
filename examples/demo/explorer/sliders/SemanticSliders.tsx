import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function SemanticSliders() {
  const tension = useExplorerStore(s => s.tension);
  const valence = useExplorerStore(s => s.valence);
  const stature = useExplorerStore(s => s.stature);
  const setTension = useExplorerStore(s => s.setTension);
  const setValence = useExplorerStore(s => s.setValence);
  const setStature = useExplorerStore(s => s.setStature);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Circumplex
      </div>
      <SliderRow label="tension" value={tension} min={-1} max={1} step={0.01} onChange={setTension} />
      <SliderRow label="valence" value={valence} min={-1} max={1} step={0.01} onChange={setValence} />
      <SliderRow label="stature" value={stature} min={-1} max={1} step={0.01} onChange={setStature} />
    </div>
  );
}
