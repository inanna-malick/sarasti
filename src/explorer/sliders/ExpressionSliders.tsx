import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ExpressionSliders() {
  const valence = useExplorerStore(s => s.valence);
  const aperture = useExplorerStore(s => s.aperture);
  const distress = useExplorerStore(s => s.distress);
  const surprise = useExplorerStore(s => s.surprise);
  const setValence = useExplorerStore(s => s.setValence);
  const setAperture = useExplorerStore(s => s.setAperture);
  const setDistress = useExplorerStore(s => s.setDistress);
  const setSurprise = useExplorerStore(s => s.setSurprise);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Expression
      </div>
      <SliderRow label="valence" value={valence} min={-3} max={3} step={0.01} onChange={setValence} />
      <SliderRow label="aperture" value={aperture} min={-3} max={3} step={0.01} onChange={setAperture} />
      <SliderRow label="distress" value={distress} min={-3} max={3} step={0.01} onChange={setDistress} />
      <SliderRow label="surprise" value={surprise} min={-3} max={3} step={0.01} onChange={setSurprise} />
    </div>
  );
}
