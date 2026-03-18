import React, { useState } from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';
import { N_SHAPE, N_EXPR } from '@/constants';

function CollapsibleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', color: '#888', cursor: 'pointer',
          fontSize: 10, fontFamily: 'monospace', padding: '2px 0', textAlign: 'left',
          width: '100%',
        }}
      >
        {open ? '▾' : '▸'} {title}
      </button>
      {open && <div style={{ paddingLeft: 8 }}>{children}</div>}
    </div>
  );
}

function RawShapeGroup({ start }: { start: number }) {
  const rawShape = useExplorerStore(s => s.rawShape);
  const setRawShape = useExplorerStore(s => s.setRawShape);
  const end = Math.min(start + 10, N_SHAPE);
  const sliders = [];
  for (let i = start; i < end; i++) {
    sliders.push(
      <SliderRow
        key={i}
        label={`\u03B2${i}`}
        value={rawShape[i]}
        min={-5}
        max={5}
        step={0.01}
        onChange={v => setRawShape(i, v)}
      />
    );
  }
  return <>{sliders}</>;
}

function RawExprGroup({ start }: { start: number }) {
  const rawExpression = useExplorerStore(s => s.rawExpression);
  const setRawExpression = useExplorerStore(s => s.setRawExpression);
  const end = Math.min(start + 10, N_EXPR);
  const sliders = [];
  for (let i = start; i < end; i++) {
    sliders.push(
      <SliderRow
        key={i}
        label={`\u03C8${i}`}
        value={rawExpression[i]}
        min={-5}
        max={5}
        step={0.01}
        onChange={v => setRawExpression(i, v)}
      />
    );
  }
  return <>{sliders}</>;
}

export function RawSliders() {
  const shapeGroups = [];
  for (let i = 0; i < N_SHAPE; i += 10) {
    const end = Math.min(i + 9, N_SHAPE - 1);
    shapeGroups.push(
      <CollapsibleGroup key={`s${i}`} title={`\u03B2${i}\u2013${end}`}>
        <RawShapeGroup start={i} />
      </CollapsibleGroup>
    );
  }

  const exprGroups = [];
  for (let i = 0; i < N_EXPR; i += 10) {
    const end = Math.min(i + 9, N_EXPR - 1);
    exprGroups.push(
      <CollapsibleGroup key={`e${i}`} title={`\u03C8${i}\u2013${end}`}>
        <RawExprGroup start={i} />
      </CollapsibleGroup>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Raw Shape (\u03B2)
      </div>
      {shapeGroups}
      <div style={{ fontSize: 11, color: '#888', marginTop: 12, marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Raw Expression (\u03C8)
      </div>
      {exprGroups}
    </div>
  );
}
