import { useExplorerStore } from '../store';
import { SliderRow } from './SliderRow';
import { sol } from '../../theme';

export function HudConfigSliders() {
  const outerRadius = useExplorerStore(s => s.hudOuterRadius);
  const ringGap = useExplorerStore(s => s.hudRingGap);
  const tubeRadius = useExplorerStore(s => s.hudTubeRadius);
  const tiltOffsetDeg = useExplorerStore(s => s.hudTiltOffsetDeg);
  const verticalOffset = useExplorerStore(s => s.hudVerticalOffset);

  return (
    <div>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: sol.base01,
        marginBottom: 8,
        borderBottom: '1px solid rgba(88,110,117,0.15)',
        paddingBottom: 4,
      }}>
        hud geometry
      </div>
      <SliderRow label="radius" value={outerRadius} min={0.05} max={0.40} step={0.005}
        onChange={useExplorerStore.getState().setHudOuterRadius} />
      <SliderRow label="gap" value={ringGap} min={0.002} max={0.04} step={0.001}
        onChange={useExplorerStore.getState().setHudRingGap} />
      <SliderRow label="tube" value={tubeRadius} min={0.001} max={0.02} step={0.001}
        onChange={useExplorerStore.getState().setHudTubeRadius} />
      <SliderRow label="tilt" value={tiltOffsetDeg} min={0} max={15} step={1}
        onChange={useExplorerStore.getState().setHudTiltOffsetDeg}
        format={v => v.toFixed(0)} />
      <SliderRow label="y-offset" value={verticalOffset} min={-0.10} max={0.10} step={0.005}
        onChange={useExplorerStore.getState().setHudVerticalOffset} />
    </div>
  );
}
