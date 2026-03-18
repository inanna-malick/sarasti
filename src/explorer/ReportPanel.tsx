import React, { useState } from 'react';
import { useExplorerStore } from './store';
import { EXPR_AXES as EXPR_MAPPINGS, SHAPE_AXES as SHAPE_MAPPINGS } from '@/binding/axes';

function ArraySection({ title, prefix, data }: { title: string; prefix: string; data: Float32Array | null }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;

  const active = Array.from(data).reduce((n, v) => n + (Math.abs(v) > 0.001 ? 1 : 0), 0);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', color: '#6cf', cursor: 'pointer',
          fontSize: 11, fontFamily: 'monospace', padding: '4px 0', textAlign: 'left',
          width: '100%', fontWeight: 'bold',
        }}
      >
        {open ? '\u25be' : '\u25b8'} {title} ({active} active)
      </button>
      {open && (
        <div style={{ paddingLeft: 8 }}>
          {Array.from(data).map((v, i) =>
            Math.abs(v) > 0.001 ? (
              <div key={i} style={{ fontSize: 10, color: '#bbb', fontFamily: 'monospace', lineHeight: 1.6 }}>
                {prefix}{i} = {v.toFixed(4)}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

export function ReportPanel() {
  const params = useExplorerStore(s => s.currentParams);
  const mode = useExplorerStore(s => s.mode);

  if (!params) return null;

  return (
    <div style={{ padding: 8, overflowY: 'auto', maxHeight: 400 }}>
      <div style={{ fontSize: 12, color: '#6cf', fontFamily: 'monospace', marginBottom: 8, fontWeight: 'bold' }}>
        Params Inspector
      </div>

      {mode === 'highlevel' && (
        <div style={{ marginBottom: 8, fontSize: 10, color: '#777', fontFamily: 'monospace' }}>
          <div style={{ color: '#888', marginBottom: 2 }}>Expression mappings:</div>
          {Object.entries(EXPR_MAPPINGS).map(([axis, mapping]) => (
            <div key={axis} style={{ paddingLeft: 8 }}>
              {axis}: {mapping.map(([i, w]) => `\u03C8${i}\u00D7${w}`).join(', ')}
            </div>
          ))}
          <div style={{ color: '#888', marginTop: 4, marginBottom: 2 }}>Shape mappings:</div>
          {Object.entries(SHAPE_MAPPINGS).map(([axis, mapping]) => (
            <div key={axis} style={{ paddingLeft: 8 }}>
              {axis}: {mapping.map(([i, w]) => `\u03B2${i}\u00D7${w}`).join(', ')}
            </div>
          ))}
        </div>
      )}

      <ArraySection title="Shape" prefix={'\u03B2'} data={params.shape} />
      <ArraySection title="Expression" prefix={'\u03C8'} data={params.expression} />

      <div style={{ fontSize: 10, color: '#bbb', fontFamily: 'monospace', marginTop: 8 }}>
        <div style={{ color: '#6cf', fontWeight: 'bold', marginBottom: 4 }}>Pose</div>
        <div>pitch: {params.pose.neck[0].toFixed(4)}</div>
        <div>yaw: {params.pose.neck[1].toFixed(4)}</div>
        <div>roll: {params.pose.neck[2].toFixed(4)}</div>
        <div>jaw: {params.pose.jaw.toFixed(4)}</div>
        <div>gaze L: [{params.pose.leftEye.map(v => v.toFixed(3)).join(', ')}]</div>
        <div>gaze R: [{params.pose.rightEye.map(v => v.toFixed(3)).join(', ')}]</div>
      </div>

      <div style={{ fontSize: 10, color: '#bbb', fontFamily: 'monospace', marginTop: 8 }}>
        <div style={{ color: '#6cf', fontWeight: 'bold', marginBottom: 4 }}>Texture</div>
        <div>flush: {params.flush.toFixed(3)}</div>
        <div>fatigue: {params.fatigue.toFixed(3)}</div>
      </div>
    </div>
  );
}
