import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';
import { MAX_DEVIATION_SIGMA } from '@/constants';

export function ExpressionSliders() {
  const deviation = useExplorerStore(s => s.deviation);
  const velocity = useExplorerStore(s => s.velocity);
  const volatility = useExplorerStore(s => s.volatility);
  const setDeviation = useExplorerStore(s => s.setDeviation);
  const setVelocity = useExplorerStore(s => s.setVelocity);
  const setVolatility = useExplorerStore(s => s.setVolatility);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Expression (Crisis)
      </div>
      <SliderRow label="deviation" value={deviation} min={-MAX_DEVIATION_SIGMA} max={MAX_DEVIATION_SIGMA} step={0.001} onChange={setDeviation} />
      <SliderRow label="velocity" value={velocity} min={-3} max={3} step={0.01} onChange={setVelocity} />
      <SliderRow label="volatility" value={volatility} min={0} max={3} step={0.01} onChange={setVolatility} />
    </div>
  );
}
