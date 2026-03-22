#!/usr/bin/env tsx
/**
 * Generate wave16 sweep config: all expressions × 4 cameras.
 */

interface RenderConfig {
  params: Record<string, string>;
  output: string;
}

const CAMERAS = ['front', 'left34', 'closeup', 'closeup_eyes'] as const;
const OUT_DIR = 'tools/eval/data/renders/wave16';

type FaceConfig = { name: string; params: Record<string, string> };

const faces: FaceConfig[] = [
  // Neutral
  { name: 'neutral', params: {} },

  // Solo expression axes at ±1.0
  { name: 'alarmed_1.0', params: { alarm: '1.0' } },
  { name: 'euphoric_1.0', params: { alarm: '-1.0' } },
  { name: 'wired_1.0', params: { fatigue: '1.0' } },
  { name: 'exhausted_1.0', params: { fatigue: '-1.0' } },
  { name: 'aggressive_1.0', params: { aggression: '1.0' } },
  { name: 'yielding_1.0', params: { aggression: '-1.0' } },
  { name: 'smirk_1.0', params: { smirk: '1.0' } },

  // Solo shape axes at ±1.0
  { name: 'chad_1.0', params: { dominance: '1.0' } },
  { name: 'soyboi_1.0', params: { dominance: '-1.0' } },
  { name: 'weathered_1.0', params: { maturity: '1.0' } },
  { name: 'young_1.0', params: { maturity: '-1.0' } },
  { name: 'sharp_1.0', params: { sharpness: '1.0' } },
  { name: 'puffy_1.0', params: { sharpness: '-1.0' } },

  // Key combos
  { name: 'combo_crisis', params: { alarm: '1.0', fatigue: '-1.0', aggression: '1.0' } },
  { name: 'combo_calm', params: { alarm: '-1.0', fatigue: '0.5', aggression: '-0.5' } },
  { name: 'combo_sharp-chad-crisis', params: { sharpness: '1.0', dominance: '1.0', alarm: '1.0', fatigue: '-1.0', aggression: '1.0' } },
  { name: 'combo_puffy-soyboi-calm', params: { sharpness: '-1.0', dominance: '-1.0', alarm: '-1.0', fatigue: '0.5', aggression: '-0.5' } },
];

const configs: RenderConfig[] = [];
for (const face of faces) {
  for (const cam of CAMERAS) {
    configs.push({
      params: { ...face.params, camera: cam },
      output: `${OUT_DIR}/${face.name}_${cam}.png`,
    });
  }
}

console.log(JSON.stringify(configs, null, 2));
console.error(`Generated ${configs.length} render configs`);
