import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ExpressionSliders() {
  const alarm = useExplorerStore(s => s.alarm);
  const fatigue = useExplorerStore(s => s.fatigue);
  const aggression = useExplorerStore(s => s.aggression);
  const setAlarm = useExplorerStore(s => s.setAlarm);
  const setFatigue = useExplorerStore(s => s.setFatigue);
  const setAggression = useExplorerStore(s => s.setAggression);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Expression Axes
      </div>
      <SliderRow label="alarm" value={alarm} min={-1} max={1} step={0.01} onChange={setAlarm} />
      <SliderRow label="fatigue" value={fatigue} min={-1} max={1} step={0.01} onChange={setFatigue} />
      <SliderRow label="aggression" value={aggression} min={-1} max={1} step={0.01} onChange={setAggression} />
    </div>
  );
}
