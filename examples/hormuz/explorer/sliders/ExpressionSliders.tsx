import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ExpressionSliders() {
  const alarm = useExplorerStore(s => s.alarm);
  const mood = useExplorerStore(s => s.mood);
  const fatigue = useExplorerStore(s => s.fatigue);
  const vigilance = useExplorerStore(s => s.vigilance);
  const setAlarm = useExplorerStore(s => s.setAlarm);
  const setMood = useExplorerStore(s => s.setMood);
  const setFatigue = useExplorerStore(s => s.setFatigue);
  const setVigilance = useExplorerStore(s => s.setVigilance);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Expression Axes
      </div>
      <SliderRow label="alarm" value={alarm} min={-3} max={3} step={0.01} onChange={setAlarm} />
      <SliderRow label="mood" value={mood} min={-3} max={3} step={0.01} onChange={setMood} />
      <SliderRow label="fatigue" value={fatigue} min={-3} max={3} step={0.01} onChange={setFatigue} />
      <SliderRow label="vigilance" value={vigilance} min={-3} max={3} step={0.01} onChange={setVigilance} />
    </div>
  );
}
