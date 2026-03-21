import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createFlamePipeline } from '@/renderer/flame/pipeline';
import { FlameFaceMesh } from '@/renderer/flame/mesh';
import { FLAME_DATA_BASE } from '@/renderer/constants';
import { useExplorerStore } from './store';

/**
 * ExplorerRenderer renders a single FlameFaceMesh in a Three.js canvas.
 * It provides OrbitControls for inspection and reacts to changes in the explorer store.
 */
export function ExplorerRenderer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let controls: OrbitControls;
    let mesh: FlameFaceMesh | null = null;
    let animationFrameId: number | null = null;
    let resizeObserver: ResizeObserver;
    let unsubscribe: () => void;

    async function init() {
      if (!containerRef.current) return;

      try {
        // 1. Initialize pipeline (model only, directions loaded lazily by store)
        const pipeline = await createFlamePipeline(FLAME_DATA_BASE);

        if (disposed) return;


        // 2. Setup Three.js Scene
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x002b36);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        if (containerRef.current) {
          containerRef.current.appendChild(renderer.domElement);
        }

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x002b36);

        // Lights (matching RefineHarness)
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

        // Camera
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
        camera.position.set(0, 0, 0.6);
        camera.lookAt(0, 0, 0);

        // 3. OrbitControls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.target.set(0, 0, 0);
        controls.update();

        // 4. FlameFaceMesh
        mesh = new FlameFaceMesh(pipeline, 'explorer');
        mesh.mesh.scale.setScalar(1);
        mesh.mesh.position.set(0, 0, 0);
        scene.add(mesh.mesh);

        // 5. Reactive Subscription
        unsubscribe = useExplorerStore.subscribe((state) => {
          if (mesh && state.currentParams) {
            mesh.updateFromParams(state.currentParams);
          }
        });

        if (disposed) {
          unsubscribe();
          return;
        }

        // 6. Resize Handling
        if (containerRef.current) {
          resizeObserver = new ResizeObserver((entries) => {
            if (!entries[0]) return;
            const { width, height } = entries[0].contentRect;
            if (width === 0 || height === 0) return;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          });
          resizeObserver.observe(containerRef.current);
          
          // Trigger initial resize
          const { width, height } = containerRef.current.getBoundingClientRect();
          if (width > 0 && height > 0) {
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          }
        }

        // 7. Initial Recompute
        useExplorerStore.getState().recompute();

        // 8. Render Loop
        const renderLoop = () => {
          if (disposed) return;
          animationFrameId = requestAnimationFrame(renderLoop);
          controls.update();
          renderer.render(scene, camera);
        };
        renderLoop();
      } catch (err) {
        console.error('Failed to initialize ExplorerRenderer:', err);
      }
    }

    init();

    return () => {
      disposed = true;
      if (animationFrameId != null) cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
      if (unsubscribe) unsubscribe();

      if (mesh) {
        scene?.remove(mesh.mesh);
        mesh.dispose();
      }
      if (controls) controls.dispose();
      if (renderer) {
        renderer.dispose();
        if (containerRef.current && renderer.domElement.parentElement === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, []);


  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        position: 'relative'
      }} 
    />
  );
}
