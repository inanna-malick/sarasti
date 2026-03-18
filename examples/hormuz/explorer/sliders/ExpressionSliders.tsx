import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';

export function ExpressionSliders() {
  const joy = useExplorerStore(s => s.joy);
  const anguish = useExplorerStore(s => s.anguish);
  const surprise = useExplorerStore(s => s.surprise);
  const tension = useExplorerStore(s => s.tension);
  const setJoy = useExplorerStore(s => s.setJoy);
  const setAnguish = useExplorerStore(s => s.setAnguish);
  const setSurprise = useExplorerStore(s => s.setSurprise);
  const setTension = useExplorerStore(s => s.setTension);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Expression
      </div>
      <SliderRow label="joy" value={joy} min={-3} max={3} step={0.01} onChange={setJoy} />
      <SliderRow label="anguish" value={anguish} min={-3} max={3} step={0.01} onChange={setAnguish} />
      <SliderRow label="surprise" value={surprise} min={-3} max={3} step={0.01} onChange={setSurprise} />
      <SliderRow label="tension" value={tension} min={-3} max={3} step={0.01} onChange={setTension} />
    </div>
  );
}
