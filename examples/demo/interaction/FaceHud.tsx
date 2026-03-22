import React from 'react';
import type { FaceInstance, AssetClass } from '../../../src/types';
import { useStore } from '../../../src/store';
import { FaceHud as LibFaceHud } from '../../../src/ui';
import type { RingSignal, HudLabel, HudAnnotation } from '../../../src/ui';
import { sol, theme } from '../theme';

const CLASS_COLORS: Record<AssetClass, string> = {
  energy: sol.orange,
  equity: sol.blue,
  fear: sol.red,
  currency: sol.violet,
  commodity: sol.green,
  media: sol.magenta,
};

function clamp1(x: number): number {
  return Math.max(-1, Math.min(1, x));
}

export function FaceHud({ instance }: { instance: FaceInstance }) {
  const selectedId = useStore((s) => s.selectedId);
  const { ticker, frame } = instance;
  const isSelected = selectedId === instance.id;

  const signals: RingSignal[] = [
    {
      name: 'deviation',
      value: clamp1(frame.deviation * 3),
      negativeColor: 'rgb(220, 50, 47)',
      positiveColor: 'rgb(133, 153, 0)',
      maxOpacity: 0.35,
    },
    {
      name: 'tension',
      value: clamp1(frame.volatility * Math.abs(frame.velocity) - 0.3),
      negativeColor: 'rgb(42, 161, 152)',
      positiveColor: 'rgb(181, 137, 0)',
      maxOpacity: 0.40,
    },
    {
      name: 'valence',
      value: clamp1(frame.deviation + 0.5 * frame.momentum),
      negativeColor: 'rgb(220, 50, 47)',
      positiveColor: 'rgb(133, 153, 0)',
      maxOpacity: 0.45,
    },
  ];

  const devPercent = (frame.deviation * 100).toFixed(1);
  const devSign = frame.deviation >= 0 ? '+' : '';
  const devColor = frame.deviation >= 0 ? sol.green : sol.red;

  const label: HudLabel = {
    text: ticker.id,
    color: theme.textBright,
    accentColor: CLASS_COLORS[ticker.class],
  };

  const annotations: HudAnnotation[] = [
    { text: `${devSign}${devPercent}%`, angleDeg: 330, color: devColor, fontSize: 9, align: 'left' },
  ];

  return (
    <LibFaceHud
      signals={signals}
      label={label}
      annotations={annotations}
      selected={isSelected}
      selectedColor="rgba(42, 161, 152, 0.55)"
      theme={{
        labelColor: theme.textBright,
        labelShadow: '0 1px 4px rgba(0,0,0,0.9)',
        fontFamily: 'monospace',
      }}
    />
  );
}
