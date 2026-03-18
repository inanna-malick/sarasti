import React from 'react';

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** Format display value. Defaults to 3 decimal places. */
  format?: (v: number) => string;
}

const defaultFormat = (v: number) => v.toFixed(3);

export function SliderRow({ label, value, min, max, step, onChange, format = defaultFormat }: SliderRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <label style={{ width: 90, fontSize: 11, color: '#aaa', flexShrink: 0, fontFamily: 'monospace' }}>
        {label}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#6cf' }}
      />
      <span style={{ width: 55, fontSize: 11, color: '#ccc', fontFamily: 'monospace', textAlign: 'right' }}>
        {format(value)}
      </span>
    </div>
  );
}
