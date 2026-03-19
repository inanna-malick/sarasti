import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function SemanticSliders() {
  const distress = useExplorerStore(s => s.distress);
  const vitality = useExplorerStore(s => s.vitality);
  const metaAggression = useExplorerStore(s => s.metaAggression);
  const setDistress = useExplorerStore(s => s.setDistress);
  const setVitality = useExplorerStore(s => s.setVitality);
  const setMetaAggression = useExplorerStore(s => s.setMetaAggression);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Meta-Axes
      </div>
      <SliderRow label="distress" value={distress} min={-1} max={1} step={0.01} onChange={setDistress} />
      <SliderRow label="vitality" value={vitality} min={-1} max={1} step={0.01} onChange={setVitality} />
      <SliderRow label="aggression" value={metaAggression} min={-1} max={1} step={0.01} onChange={setMetaAggression} />
    </div>
  );
}
