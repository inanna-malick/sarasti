/**
 * 3D Flat-Color Ring HUD — d3.js / Material Design aesthetic.
 *
 * Three solid-color arc bands encoding tension, valence, stature.
 * Fully opaque, no transparency, no glow — pure flat solarized fill.
 *
 * Ring 0 (tension): outermost
 * Ring 1 (valence): middle
 * Ring 2 (stature): innermost
 *
 * Signal arc sweeps from 12 o'clock: positive clockwise, negative counter-clockwise.
 * Track background is a dark muted version of the signal color.
 */

import * as THREE from 'three';
import { interpolateHcl } from 'd3-interpolate';
import { color as d3color } from 'd3-color';
import type { RingSignal } from './types';

const TAU = 2 * Math.PI;
const MIN_ARC_FRAC = 0.12;
const TORUS_SEGMENTS = 64;
const TUBE_SEGMENTS = 8;

// Render order — signal on top of track
const RING_RENDER_ORDER_TRACK = 1;
const RING_RENDER_ORDER_SIGNAL = 2;
const RING_RENDER_ORDER_CAP = 2;
const RING_RENDER_ORDER_LABEL = 3;

// Animation
const ARC_LERP_SPEED = 0.12;

// Track graduation gaps
const GAP_HALF_DEG = 3;
const TICK_ANGLES_DEG = [90, 180, 270, 360];

// Label sprites
const LABEL_SIZE = 0.016;

// Track darkening — sol.base03 tinted toward signal color
const TRACK_DARKEN = 0.20;  // 20% signal color, 80% base03

export interface HudRings3DConfig {
  outerRadius: number;
  ringGap: number;
  tubeRadius: number;
  tiltOffsetDeg: number;
}

const DEFAULT_CONFIG: HudRings3DConfig = {
  outerRadius: 0.175,
  ringGap: 0.0125,
  tubeRadius: 0.005,
  tiltOffsetDeg: 4,
};

// sol.base03 as THREE.Color for track background mixing
const BASE03 = new THREE.Color(0x002b36);

interface RingState {
  currentArcFrac: number;
  targetArcFrac: number;
  value: number;
  color: THREE.Color;
  trackColor: THREE.Color;
  radius: number;
  tiltRad: number;
  label: string;
}

function parseColor(css: string): THREE.Color {
  const c = d3color(css);
  if (!c) return new THREE.Color(0x888888);
  const rgb = c.rgb();
  return new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255);
}

/** Mix signal color with base03 for a dark track background */
function makeTrackColor(signalColor: THREE.Color): THREE.Color {
  return new THREE.Color().copy(BASE03).lerp(signalColor, TRACK_DARKEN);
}

/** Flat opaque MeshBasicMaterial — no lighting interaction, pure d3 color */
function flatMaterial(color: THREE.Color): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    side: THREE.FrontSide,
    depthWrite: true,
    depthTest: true,
  });
}

/** Build track segments with gaps at graduation marks — flat opaque */
function buildTrackSegments(
  radius: number,
  tubeRadius: number,
  trackColor: THREE.Color,
): { geometries: THREE.TorusGeometry[]; materials: THREE.MeshBasicMaterial[]; meshes: THREE.Mesh[] } {
  const geometries: THREE.TorusGeometry[] = [];
  const materials: THREE.MeshBasicMaterial[] = [];
  const meshes: THREE.Mesh[] = [];

  const gapsDeg = TICK_ANGLES_DEG.map(a => a % 360);
  gapsDeg.sort((a, b) => a - b);

  for (let i = 0; i < gapsDeg.length; i++) {
    const gapStart = gapsDeg[i];
    const nextGap = gapsDeg[(i + 1) % gapsDeg.length];

    const segStartDeg = gapStart + GAP_HALF_DEG;
    const segEndDeg = (nextGap === 0 ? 360 : nextGap) - GAP_HALF_DEG;
    let arcDeg = segEndDeg - segStartDeg;
    if (arcDeg <= 0) arcDeg += 360;

    const arcRad = (arcDeg * Math.PI) / 180;
    const startRad = (segStartDeg * Math.PI) / 180;

    const segs = Math.max(4, Math.round(TORUS_SEGMENTS * (arcDeg / 360)));
    const geo = new THREE.TorusGeometry(radius, tubeRadius * 0.6, TUBE_SEGMENTS, segs, arcRad);
    const mat = flatMaterial(trackColor);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = startRad;
    mesh.renderOrder = RING_RENDER_ORDER_TRACK;

    geometries.push(geo);
    materials.push(mat);
    meshes.push(mesh);
  }

  return { geometries, materials, meshes };
}

/** Build rounded endcaps (spheres) at start and end of a signal arc — flat opaque */
function buildEndcaps(
  radius: number,
  tubeRadius: number,
  arcAngle: number,
  startRotZ: number,
  color: THREE.Color,
): { geometries: THREE.SphereGeometry[]; materials: THREE.MeshBasicMaterial[]; meshes: THREE.Mesh[] } {
  const geometries: THREE.SphereGeometry[] = [];
  const materials: THREE.MeshBasicMaterial[] = [];
  const meshes: THREE.Mesh[] = [];

  const capGeo = new THREE.SphereGeometry(tubeRadius, 8, 6);

  for (const angle of [0, arcAngle]) {
    const geo = capGeo.clone();
    const mat = flatMaterial(color);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = RING_RENDER_ORDER_CAP;

    const worldAngle = startRotZ + angle;
    mesh.position.set(
      radius * Math.cos(worldAngle),
      radius * Math.sin(worldAngle),
      0,
    );

    geometries.push(geo);
    materials.push(mat);
    meshes.push(mesh);
  }

  capGeo.dispose();
  return { geometries, materials, meshes };
}

/** Create a label sprite with a single character — solid color */
function createLabelSprite(
  char: string,
  color: THREE.Color,
  radius: number,
): { sprite: THREE.Sprite; material: THREE.SpriteMaterial; texture: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  ctx.font = 'bold 44px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.fillText(char, size / 2, size / 2);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(0,43,54,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeText(char, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,  // Sprite needs alpha for text cutout
    depthWrite: false,
    depthTest: true,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(LABEL_SIZE, LABEL_SIZE, 1);
  sprite.renderOrder = RING_RENDER_ORDER_LABEL;

  const labelAngle = Math.PI / 3;
  sprite.position.set(radius * Math.sin(labelAngle), radius * Math.cos(labelAngle), 0);

  return { sprite, material, texture };
}

const RING_LABELS = ['T', 'V', 'S'];

export class HudRings3D {
  readonly group: THREE.Group;
  private config: HudRings3DConfig;
  private ringStates: RingState[] = [];
  private ringGroups: THREE.Group[] = [];
  private disposables: { dispose(): void }[] = [];
  private meshes: THREE.Object3D[] = [];
  private initialized = false;

  constructor(config?: Partial<HudRings3DConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.group = new THREE.Group();
  }

  update(signals: RingSignal[]): void {
    const { outerRadius, ringGap, tiltOffsetDeg } = this.config;

    if (!this.initialized) {
      for (let i = 0; i < Math.min(signals.length, 3); i++) {
        const sig = signals[i];
        const radius = outerRadius - i * ringGap;
        const tiltRad = (i * tiltOffsetDeg * Math.PI) / 180;
        const mag = Math.abs(sig.value);
        const arcFrac = MIN_ARC_FRAC + mag * (1 - MIN_ARC_FRAC);

        const t = (sig.value + 1) / 2;
        const colorStr = interpolateHcl(sig.negativeColor, sig.positiveColor)(t);
        const color = parseColor(colorStr);

        this.ringStates.push({
          currentArcFrac: arcFrac,
          targetArcFrac: arcFrac,
          value: sig.value,
          color,
          trackColor: makeTrackColor(color),
          radius,
          tiltRad,
          label: RING_LABELS[i] ?? '',
        });
      }
      this.initialized = true;
      this.rebuild();
      return;
    }

    for (let i = 0; i < Math.min(signals.length, 3); i++) {
      const sig = signals[i];
      const state = this.ringStates[i];
      if (!state) continue;

      const mag = Math.abs(sig.value);
      state.targetArcFrac = MIN_ARC_FRAC + mag * (1 - MIN_ARC_FRAC);
      state.value = sig.value;

      const t = (sig.value + 1) / 2;
      const colorStr = interpolateHcl(sig.negativeColor, sig.positiveColor)(t);
      state.color = parseColor(colorStr);
      state.trackColor = makeTrackColor(state.color);
    }

    // Snap for static renders
    for (const state of this.ringStates) {
      state.currentArcFrac = state.targetArcFrac;
    }
    this.rebuild();
  }

  tick(): void {
    let needsRebuild = false;
    for (const state of this.ringStates) {
      const dArc = state.targetArcFrac - state.currentArcFrac;
      if (Math.abs(dArc) > 0.001) {
        state.currentArcFrac += dArc * ARC_LERP_SPEED;
        needsRebuild = true;
      }
    }
    if (needsRebuild) this.rebuild();
  }

  dispose(): void {
    this.disposeRings();
  }

  private rebuild(): void {
    this.disposeRings();
    const { tubeRadius } = this.config;

    for (const state of this.ringStates) {
      const ringGroup = new THREE.Group();
      ringGroup.rotation.x = state.tiltRad;
      this.group.add(ringGroup);
      this.ringGroups.push(ringGroup);

      // --- Track: dark muted background ring ---
      const track = buildTrackSegments(state.radius, tubeRadius, state.trackColor);
      for (const m of track.meshes) ringGroup.add(m);
      this.meshes.push(...track.meshes);
      this.disposables.push(...track.geometries, ...track.materials);

      // --- Signal arc: full solarized color ---
      const arcAngle = state.currentArcFrac * TAU;
      const signalGeo = new THREE.TorusGeometry(
        state.radius, tubeRadius, TUBE_SEGMENTS,
        Math.max(8, Math.round(TORUS_SEGMENTS * state.currentArcFrac)),
        arcAngle,
      );
      const signalMat = flatMaterial(state.color);
      const signalMesh = new THREE.Mesh(signalGeo, signalMat);
      signalMesh.renderOrder = RING_RENDER_ORDER_SIGNAL;

      const rotZ = state.value >= 0
        ? Math.PI / 2
        : Math.PI / 2 + arcAngle;
      signalMesh.rotation.z = rotZ;

      ringGroup.add(signalMesh);
      this.meshes.push(signalMesh);
      this.disposables.push(signalGeo, signalMat);

      // --- Endcaps ---
      const caps = buildEndcaps(state.radius, tubeRadius, arcAngle, rotZ, state.color);
      for (const m of caps.meshes) ringGroup.add(m);
      this.meshes.push(...caps.meshes);
      this.disposables.push(...caps.geometries, ...caps.materials);

      // --- Label sprite ---
      if (state.label) {
        const lbl = createLabelSprite(state.label, state.color, state.radius);
        ringGroup.add(lbl.sprite);
        this.meshes.push(lbl.sprite);
        this.disposables.push(lbl.material, lbl.texture);
      }
    }
  }

  private disposeRings(): void {
    for (const d of this.disposables) d.dispose();
    for (const m of this.meshes) m.removeFromParent();
    for (const g of this.ringGroups) g.removeFromParent();
    this.disposables = [];
    this.meshes = [];
    this.ringGroups = [];
  }
}
