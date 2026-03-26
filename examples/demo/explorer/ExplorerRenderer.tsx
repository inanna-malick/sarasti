import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createFlamePipeline } from '../../../src/renderer/flame/pipeline';
import type { PipelineOptions } from '../../../src/renderer/flame/pipeline';
import { FlameFaceMesh } from '../../../src/renderer/flame/mesh';
import { FLAME_DATA_BASE } from '../../../src/renderer/constants';
import { useExplorerStore } from './store';
import type { DebugMaterial } from './store';
import type { CameraPreset } from './ExplorerPane';
import { HudRings3D } from '../../../src/ui/HudRings3D';
import type { HudRings3DConfig } from '../../../src/ui/HudRings3D';
import { computeCircumplex } from '../../../src/binding/chords';
import type { RingSignal } from '../../../src/ui/types';
import { RING_META } from '../../../src/ui/ringMeta';

declare global {
  interface Window {
    __EXPLORER_READY?: boolean;
  }
}

const CAMERA_PRESETS: Record<CameraPreset, [number, number, number]> = {
  front:        [0,     0,    0.6],
  left34:       [-0.25, 0.05, 0.53],
  right34:      [0.25,  0.05, 0.53],
  closeup:      [0,    -0.01, 0.32],
  closeup_eyes: [0,     0.01, 0.22],
  closeup_mouth:[0,    -0.04, 0.22],
};

interface ExplorerRendererProps {
  headless?: boolean;
  camera?: CameraPreset;
}

export function ExplorerRenderer({ headless = false, camera = 'front' }: ExplorerRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls | null = null;
    let mesh: FlameFaceMesh | null = null;
    let hudRings: HudRings3D | null = null;
    let animationFrameId: number;
    let resizeObserver: ResizeObserver | null = null;
    let unsubscribe: (() => void) | null = null;

    async function init() {
      if (!containerRef.current) return;

      try {
        // Read pipeline feature flags from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const pipelineOpts: PipelineOptions = {
          enableMouth: false,
          enableEyes: urlParams.get('enable_eyes') !== 'false',
        };
        const pipeline = await createFlamePipeline(FLAME_DATA_BASE, pipelineOpts);

        if (disposed) return;

        const container = containerRef.current!;

        if (headless) {
          renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true,
          });
          renderer.setPixelRatio(1);
          renderer.setSize(512, 512);
        } else {
          const rect = container.getBoundingClientRect();
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
          renderer.setPixelRatio(window.devicePixelRatio);
          renderer.setSize(rect.width, rect.height);
        }

        renderer.setClearColor(0x002b36);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x002b36);

        const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.8);
        keyLight.position.set(-2, 3, 4);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xf0f0ff, 0.7);
        fillLight.position.set(3, 0, 3);
        scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(0, 2, -4);
        scene.add(backLight);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        scene.add(ambientLight);

        const aspect = headless ? 1 : (container.getBoundingClientRect().width / container.getBoundingClientRect().height);
        const camObj = new THREE.PerspectiveCamera(45, aspect, 0.1, 10);
        const preset = CAMERA_PRESETS[camera];
        camObj.position.set(preset[0], preset[1], preset[2]);
        camObj.lookAt(0, 0, 0);

        if (!headless) {
          controls = new OrbitControls(camObj, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.1;
          controls.target.set(0, 0, 0);
        }

        mesh = new FlameFaceMesh(pipeline, 'explorer');
        mesh.mesh.scale.setScalar(1);
        mesh.mesh.position.set(0, 0, 0);
        scene.add(mesh.mesh);

        // Apply debug material mode if set
        const debugMat = useExplorerStore.getState().debugMaterial;
        if (debugMat !== 'normal') {
          mesh.setDebugMaterial(debugMat);
        }

        // 3D HUD rings — always on, orbital tori around the face
        // Track config for change detection
        let prevHudConfig: HudRings3DConfig = {
          outerRadius: useExplorerStore.getState().hudOuterRadius,
          ringGap: useExplorerStore.getState().hudRingGap,
          tubeRadius: useExplorerStore.getState().hudTubeRadius,
          tiltOffsetDeg: useExplorerStore.getState().hudTiltOffsetDeg,
        };
        let prevVerticalOffset = useExplorerStore.getState().hudVerticalOffset;
        let lastSignals: RingSignal[] = [];

        hudRings = new HudRings3D(prevHudConfig);
        hudRings.group.position.set(0, prevVerticalOffset, -0.05);
        scene.add(hudRings.group);

        // Helper to build ring signals from circumplex values
        function buildRingSignals(tension: number, valence: number, stature: number): RingSignal[] {
          const values = { tension, valence, stature };
          return RING_META.map((meta) => ({
            name: meta.key,
            negativeColor: meta.negativeColor,
            positiveColor: meta.positiveColor,
            value: values[meta.key],
          }));
        }

        // Initialize rings with current slider values (subscriber only fires on change)
        {
          const s = useExplorerStore.getState();
          lastSignals = buildRingSignals(s.tension, s.valence, s.stature);
          hudRings.update(lastSignals);
        }

        if (!headless) {
          resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
              const { width, height } = entry.contentRect;
              if (width > 0 && height > 0) {
                renderer.setSize(width, height);
                camObj.aspect = width / height;
                camObj.updateProjectionMatrix();
              }
            }
          });
          resizeObserver.observe(container);
        }

        // Subscribe to store changes
        unsubscribe = useExplorerStore.subscribe((state) => {
          if (state.currentParams && mesh) {
            mesh.updateFromParams(state.currentParams);
          }
          // Update 3D HUD rings — use data-mode circumplex or slider values
          if (hudRings) {
            // Check for HUD geometry config changes
            const newHudConfig: HudRings3DConfig = {
              outerRadius: state.hudOuterRadius,
              ringGap: state.hudRingGap,
              tubeRadius: state.hudTubeRadius,
              tiltOffsetDeg: state.hudTiltOffsetDeg,
            };
            const geometryChanged =
              newHudConfig.outerRadius !== prevHudConfig.outerRadius ||
              newHudConfig.ringGap !== prevHudConfig.ringGap ||
              newHudConfig.tubeRadius !== prevHudConfig.tubeRadius ||
              newHudConfig.tiltOffsetDeg !== prevHudConfig.tiltOffsetDeg;

            if (geometryChanged) {
              hudRings.dispose();
              scene.remove(hudRings.group);
              hudRings = new HudRings3D(newHudConfig);
              hudRings.group.position.set(0, state.hudVerticalOffset, -0.05);
              scene.add(hudRings.group);
              if (lastSignals.length > 0) hudRings.update(lastSignals);
              prevHudConfig = newHudConfig;
              prevVerticalOffset = state.hudVerticalOffset;
            } else if (state.hudVerticalOffset !== prevVerticalOffset) {
              hudRings.group.position.y = state.hudVerticalOffset;
              prevVerticalOffset = state.hudVerticalOffset;
            }

            let tension: number, valence: number, stature: number;
            if (state.dataModeFrame && state.dataModeTickerId) {
              const activations = computeCircumplex(
                state.dataModeFrame,
                state.dataModeStats ?? undefined,
                state.dataModeTickerId,
              );
              tension = activations.tension;
              valence = activations.valence;
              stature = activations.stature;
            } else {
              tension = state.tension;
              valence = state.valence;
              stature = state.stature;
            }
            lastSignals = buildRingSignals(tension, valence, stature);
            hudRings.update(lastSignals);
          }
        });

        // Trigger initial recompute and apply immediately
        useExplorerStore.getState().recompute();
        const initialParams = useExplorerStore.getState().currentParams;
        if (initialParams && mesh) {
          mesh.updateFromParams(initialParams);
        }

        // First render + signal ready
        renderer.render(scene, camObj);
        if (headless) {
          // In data mode, loadDataMode() sets __EXPLORER_READY after async data load.
          // In other modes, signal ready immediately.
          const isDataMode = new URLSearchParams(window.location.search).get('mode') === 'data';
          if (!isDataMode) {
            window.__EXPLORER_READY = true;
          }
        }

        function renderLoop() {
          if (disposed) return;
          animationFrameId = requestAnimationFrame(renderLoop);
          controls?.update();
          hudRings?.tick();
          renderer.render(scene, camObj);
        }
        renderLoop();
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    init();

    return () => {
      disposed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      unsubscribe?.();
      if (resizeObserver) resizeObserver.disconnect();
      if (hudRings) hudRings.dispose();
      if (mesh) mesh.dispose();
      if (controls) controls.dispose();
      if (renderer) {
        renderer.dispose();
        if (containerRef.current && renderer.domElement.parentElement === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  if (error) {
    return <div style={{ color: 'red', padding: 20 }}>Error: {error}</div>;
  }

  if (headless) {
    return <div ref={containerRef} style={{ width: 512, height: 512 }} />;
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
