import React from 'react';
import { SliderRow } from './SliderRow';
import { useExplorerStore } from '../store';
import { MAX_NECK_PITCH, MAX_NECK_YAW, MAX_NECK_ROLL, MAX_JAW_OPEN } from '../../../../src/constants';

export function PoseSliders() {
  const poseOverride = useExplorerStore(s => s.poseOverride);
  const pitch = useExplorerStore(s => s.pitch);
  const yaw = useExplorerStore(s => s.yaw);
  const roll = useExplorerStore(s => s.roll);
  const jawOpen = useExplorerStore(s => s.jawOpen);
  const setPoseOverride = useExplorerStore(s => s.setPoseOverride);
  const setPitch = useExplorerStore(s => s.setPitch);
  const setYaw = useExplorerStore(s => s.setYaw);
  const setRoll = useExplorerStore(s => s.setRoll);
  const setJawOpen = useExplorerStore(s => s.setJawOpen);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
          Pose
        </span>
        <label style={{ fontSize: 10, color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={poseOverride}
            onChange={e => setPoseOverride(e.target.checked)}
            style={{ accentColor: '#6cf' }}
          />
          override
        </label>
      </div>
      <div style={{ opacity: poseOverride ? 1 : 0.4, pointerEvents: poseOverride ? 'auto' : 'none' }}>
        <SliderRow label="pitch" value={pitch} min={-MAX_NECK_PITCH} max={MAX_NECK_PITCH} step={0.001} onChange={setPitch} />
        <SliderRow label="yaw" value={yaw} min={-MAX_NECK_YAW} max={MAX_NECK_YAW} step={0.001} onChange={setYaw} />
        <SliderRow label="roll" value={roll} min={-MAX_NECK_ROLL} max={MAX_NECK_ROLL} step={0.001} onChange={setRoll} />
        <SliderRow label="jaw open" value={jawOpen} min={0} max={MAX_JAW_OPEN} step={0.001} onChange={setJawOpen} />
      </div>
    </div>
  );
}
