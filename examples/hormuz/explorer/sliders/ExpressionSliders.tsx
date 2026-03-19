import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ExpressionSliders() {
  const tension = useExplorerStore(s => s.tension);
  const mood = useExplorerStore(s => s.mood);
  const setTension = useExplorerStore(s => s.setTension);
  const setMood = useExplorerStore(s => s.setMood);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Expression Axes
      </div>
      <SliderRow label="tension" value={tension} min={-3} max={3} step={0.01} onChange={setTension} />
      <SliderRow label="mood" value={mood} min={-3} max={3} step={0.01} onChange={setMood} />
    </div>
  );
}
