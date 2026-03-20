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
    let animationFrameId: number;
    let resizeObserver: ResizeObserver | null = null;
    let unsubscribe: (() => void) | null = null;

    async function init() {
      if (!containerRef.current) return;

      try {
        // Read pipeline feature flags from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const pipelineOpts: PipelineOptions = {
          enableMouth: urlParams.get('enable_mouth') === 'true',
          enableEyes: urlParams.get('enable_eyes') === 'true',
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

        renderer.setClearColor(0x1a1a1a);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

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
