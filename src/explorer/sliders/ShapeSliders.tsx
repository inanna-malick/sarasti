import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';
import type { AssetClass } from '@/types';

const ASSET_CLASSES: AssetClass[] = ['energy', 'commodity', 'fear', 'currency', 'equity', 'media'];

const FAMILIES = [
  'brent', 'wti', 'natgas', 'distill', 'consumer', 'vol', 'haven',
  'currency', 'rates', 'sector', 'broad', 'gdelt',
];

export function ShapeSliders() {
  const age = useExplorerStore(s => s.age);
  const assetClass = useExplorerStore(s => s.assetClass);
  const family = useExplorerStore(s => s.family);
  const setAge = useExplorerStore(s => s.setAge);
  const setAssetClass = useExplorerStore(s => s.setAssetClass);
  const setFamily = useExplorerStore(s => s.setFamily);

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
        Shape (Identity)
      </div>
      <SliderRow label="age" value={age} min={20} max={60} step={1} onChange={setAge} format={v => String(Math.round(v))} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <label style={{ width: 90, fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>class</label>
        <select
          value={assetClass}
          onChange={e => setAssetClass(e.target.value as AssetClass)}
          style={{
            flex: 1, background: '#2a2a2a', color: '#ccc', border: '1px solid #444',
            borderRadius: 3, padding: '2px 4px', fontSize: 11, fontFamily: 'monospace',
          }}
        >
          {ASSET_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <label style={{ width: 90, fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>family</label>
        <select
          value={family}
          onChange={e => setFamily(e.target.value)}
          style={{
            flex: 1, background: '#2a2a2a', color: '#ccc', border: '1px solid #444',
            borderRadius: 3, padding: '2px 4px', fontSize: 11, fontFamily: 'monospace',
          }}
        >
          {FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
    </div>
  );
}
