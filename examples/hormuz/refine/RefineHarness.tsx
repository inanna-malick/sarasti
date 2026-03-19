import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createFlamePipeline } from '../../../src/renderer/flame/pipeline';
import { FlameFaceMesh } from '../../../src/renderer/flame/mesh';
import { resolve } from '../../../src/binding/resolve';
import { DEFAULT_BINDING_CONFIG } from '../../../src/binding/config';
import type { TickerConfig, TickerFrame } from '../../../src/types';
import type { BindingConfig } from '../../../src/binding/types';
import { FLAME_DATA_BASE } from '../../../src/renderer/constants';
import { TICKERS } from '../tickers';

export interface RefineConfig {
  tickerId: string;
  overrides: {
    irisRadius?: number;
    pupilRadius?: number;
    maxJaw?: number;
    maxNeckPitch?: number;
    maxNeckYaw?: number;
    deviationSteepness?: number;
    velocitySteepness?: number;
    maxEyeHorizontal?: number;
    maxEyeVertical?: number;
  };
  frame: { deviation: number; velocity: number; volatility: number; drawdown: number; momentum: number; mean_reversion_z: number; beta: number; };
}

declare global {
  interface Window {
    __REFINE_CONFIG?: RefineConfig;
    __REFINE_READY?: boolean;
    __REFINE_TARGET_VERSION?: number;
    __REFINE_RENDERED_VERSION?: number;
  }
}

export function RefineHarness() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let mesh: FlameFaceMesh | null = null;
    let animationFrameId: number;

    async function init() {
      if (!containerRef.current) return;

      try {
        const pipeline = await createFlamePipeline(FLAME_DATA_BASE);

        if (disposed) return;

        // Setup Three.js minimal scene (512x512)
        const size = 512;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
        renderer.setPixelRatio(1); // Force pixel ratio 1 for deterministic screenshots
        renderer.setSize(size, size);
        renderer.setClearColor(0x1a1a1a);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
        containerRef.current.appendChild(renderer.domElement);

        scene = new THREE.Scene();
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

        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
        // Fixed camera framing the face
        camera.position.set(0, 0, 0.6);
        camera.lookAt(0, 0, 0);

        let lastConfigStr = '';

        function renderLoop() {
          if (disposed) return;
          animationFrameId = requestAnimationFrame(renderLoop);

          const config = window.__REFINE_CONFIG;
          if (config) {
            const configStr = JSON.stringify(config);
            if (configStr !== lastConfigStr) {
              lastConfigStr = configStr;

              // Setup mesh if new or ticker changed (simplified: just recreate if ticker changes)
              if (!mesh || (mesh as any)['__tickerId'] !== config.tickerId || (mesh as any)['__irisRadius'] !== config.overrides.irisRadius || (mesh as any)['__pupilRadius'] !== config.overrides.pupilRadius) {
                if (mesh) {
                  scene.remove(mesh.mesh);
                  mesh.dispose();
                }
                const eyeOverrides = {
                  irisRadius: config.overrides.irisRadius,
                  pupilRadius: config.overrides.pupilRadius,
                };
                mesh = new FlameFaceMesh(pipeline, config.tickerId, eyeOverrides);
                // Keep track of parameters to avoid unnecessary recreation
                (mesh as any)['__tickerId'] = config.tickerId;
                (mesh as any)['__irisRadius'] = config.overrides.irisRadius;
                (mesh as any)['__pupilRadius'] = config.overrides.pupilRadius;

                // Typical scale/position from compositor
                mesh.mesh.scale.setScalar(1);
                mesh.mesh.position.set(0, 0, 0);
                scene.add(mesh.mesh);
              }

              // Build custom binding config with pose/gaze threading
              const customConfig: BindingConfig = {
                ...DEFAULT_BINDING_CONFIG,
                poseConfig: {
                  maxPitch: config.overrides.maxNeckPitch,
                  maxYaw: config.overrides.maxNeckYaw,
                  maxJaw: config.overrides.maxJaw,
                },
                gazeConfig: {
                  maxHorizontal: config.overrides.maxEyeHorizontal,
                  maxVertical: config.overrides.maxEyeVertical,
                },
              };

              // Look up real ticker identity from registry
              const ticker: TickerConfig = TICKERS.find(t => t.id === config.tickerId) ?? {
                id: config.tickerId,
                name: config.tickerId,
                class: 'equity' as const,
                family: 'broad',
                age: 40,
              };

              const frameData: TickerFrame = {
                close: 100,
                volume: 1000,
                deviation: config.frame.deviation,
                velocity: config.frame.velocity,
                volatility: config.frame.volatility,
                drawdown: config.frame.drawdown ?? 0,
                momentum: config.frame.momentum ?? 0,
                mean_reversion_z: config.frame.mean_reversion_z ?? 0,
                beta: config.frame.beta ?? 1,
              };

              const params = resolve(ticker, frameData, customConfig);
              mesh.updateFromParams(params);

              // Debug: override face opacity to see teeth through skin
              if ((config.overrides as any).faceOpacity != null) {
                const opacity = (config.overrides as any).faceOpacity;
                const mats = Array.isArray(mesh.mesh.material) ? mesh.mesh.material : [mesh.mesh.material];
                for (const mat of mats) {
                  (mat as any).opacity = opacity;
                  (mat as any).transparent = true;
                  (mat as any).depthWrite = false;
                }
              }
            }
          }

          renderer.render(scene, camera);

          if (window.__REFINE_TARGET_VERSION) {
            window.__REFINE_RENDERED_VERSION = window.__REFINE_TARGET_VERSION;
          }
        }

        renderLoop();
        window.__REFINE_READY = true;

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    init();

    return () => {
      disposed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (mesh) {
        scene.remove(mesh.mesh);
        mesh.dispose();
      }
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

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
      <div ref={containerRef} style={{ width: 512, height: 512 }} />
    </div>
  );
}
