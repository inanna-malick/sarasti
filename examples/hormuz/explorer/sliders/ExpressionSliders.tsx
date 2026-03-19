import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ExpressionSliders() {
  const alarm = useExplorerStore(s => s.alarm);
  const valence = useExplorerStore(s => s.valence);
  const arousal = useExplorerStore(s => s.arousal);
  const setAlarm = useExplorerStore(s => s.setAlarm);
  const setValence = useExplorerStore(s => s.setValence);
  const setArousal = useExplorerStore(s => s.setArousal);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Expression Chords
      </div>
      <SliderRow label="alarm" value={alarm} min={-3} max={3} step={0.01} onChange={setAlarm} />
      <SliderRow label="valence" value={valence} min={-3} max={3} step={0.01} onChange={setValence} />
      <SliderRow label="arousal" value={arousal} min={-3} max={3} step={0.01} onChange={setArousal} />
    </div>
  );
}
