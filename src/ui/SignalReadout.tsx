import { CircumplexDebug } from '../binding/chords';
import { TickerFrame } from '../types';
import { RING_META } from './ringMeta';
import { RingCard } from './RingCard';

interface SignalReadoutProps {
  debug: CircumplexDebug;
  frame: TickerFrame;
}

export function SignalReadout({ debug, frame }: SignalReadoutProps) {
  const rawValues: Record<string, number> = {
    vol: frame.volatility,
    vel: frame.velocity,
    dev: frame.deviation,
    dd: frame.drawdown,
    mom: frame.momentum,
    mr: frame.mean_reversion_z,
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  };

  return (
    <div style={containerStyle}>
      {RING_META.map(meta => (
        <RingCard
          key={meta.key}
          meta={meta}
          value={debug[meta.key as keyof CircumplexDebug] as number}
          input={debug.inputs[meta.key as keyof typeof debug.inputs]}
          zScores={debug.zScores}
          rawValues={rawValues}
        />
      ))}
    </div>
  );
}
