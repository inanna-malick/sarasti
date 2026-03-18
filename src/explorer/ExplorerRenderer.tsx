import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createFlamePipeline } from '@/renderer/flame/pipeline';
import { FlameFaceMesh } from '@/renderer/flame/mesh';
import { loadDirectionTables } from '@/binding/directions';
import { FLAME_DATA_BASE } from '@/renderer/constants';
import { useExplorerStore } from './store';

export function ExplorerRenderer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let mesh: FlameFaceMesh | null = null;
    let animationFrameId: number;
    let resizeObserver: ResizeObserver;
    let unsubscribe: (() => void) | null = null;

    async function init() {
      if (!containerRef.current) return;

      try {
        await loadDirectionTables('/data/directions');
        const pipeline = await createFlamePipeline(FLAME_DATA_BASE);

        if (disposed) return;

        const container = containerRef.current!;
        const rect = container.getBoundingClientRect();

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(rect.width, rect.height);
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

        const aspect = rect.width / rect.height;
        const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 10);
        camera.position.set(0, 0, 0.6);
        camera.lookAt(0, 0, 0);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.target.set(0, 0, 0);

        mesh = new FlameFaceMesh(pipeline, 'explorer');
        mesh.mesh.scale.setScalar(1);
        mesh.mesh.position.set(0, 0, 0);
        scene.add(mesh.mesh);

        // Handle resize
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
              renderer.setSize(width, height);
              camera.aspect = width / height;
              camera.updateProjectionMatrix();
            }
          }
        });
        resizeObserver.observe(container);

        // Subscribe to store changes
        let lastParams: ReturnType<typeof useExplorerStore.getState>['currentParams'] = null;
        unsubscribe = useExplorerStore.subscribe((state) => {
          if (state.currentParams && state.currentParams !== lastParams) {
            lastParams = state.currentParams;
            if (mesh) mesh.updateFromParams(state.currentParams);
          }
        });

        // Trigger initial recompute
        useExplorerStore.getState().recompute();

        function renderLoop() {
          if (disposed) return;
          animationFrameId = requestAnimationFrame(renderLoop);
          controls.update();
          renderer.render(scene, camera);
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

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
