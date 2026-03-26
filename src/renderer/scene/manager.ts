import * as THREE from 'three';
import type { FaceRenderer, FaceInstance } from '../../types';
import type { FlameRendererOptions } from '../types';
import { createFlamePipeline } from '../flame/pipeline';
import { FLAME_DATA_BASE } from '../constants';
import { SceneCompositor } from './compositor';
import { CameraController } from './camera';
import { FacePicker } from './picking';

// Reusable vector for projectToScreen — avoids allocation per call
const _projectVec = new THREE.Vector3();

/**
 * Creates a FLAME-based FaceRenderer that composes
 * SceneCompositor + CameraController + FacePicker.
 *
 * This is the main entry point the app uses for 3D face rendering.
 */
export async function createFlameSceneRenderer(
  options: FlameRendererOptions = {},
): Promise<FaceRenderer> {
  const {
    dataBasePath = FLAME_DATA_BASE,
    antialias = true,
    pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  } = options;

  // Load FLAME model
  const pipeline = await createFlamePipeline(dataBasePath, { enableEyes: true, enableMouth: false });

  // These are initialized in init()
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let cameraController: CameraController;
  let compositor: SceneCompositor;
  let picker: FacePicker;
  let container: HTMLElement;
  let animationFrameId: number | null = null;
  let lastTime = 0;
  let hasFramedCamera = false;
  let resizeObserver: ResizeObserver | null = null;
  let lastPositions: [number, number, number][] = [];

  function animate(time: number) {
    const dt = lastTime > 0 ? (time - lastTime) / 1000 : 0;
    lastTime = time;

    cameraController.update(dt);
    compositor.tickHudRings();
    renderer.render(scene, cameraController.camera);
    animationFrameId = requestAnimationFrame(animate);
  }

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    cameraController.handleResize();
    picker.setSize(w, h);

    // Re-frame camera to fit new aspect ratio
    if (hasFramedCamera && lastPositions.length > 0) {
      cameraController.frameAll(lastPositions);
    }
  }

  const faceRenderer: FaceRenderer = {
    async init(el: HTMLElement): Promise<void> {
      container = el;

      // Three.js renderer
      renderer = new THREE.WebGLRenderer({ antialias, alpha: false });
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.setClearColor(0x002b36);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      renderer.localClippingEnabled = true;
      el.appendChild(renderer.domElement);

      // Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x002b36);

      // 3-point lighting
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
      cameraController = new CameraController(renderer.domElement);

      // Compositor
      compositor = new SceneCompositor(scene, pipeline);

      // Picker
      picker = new FacePicker(
        cameraController.camera,
        compositor,
        el.clientWidth,
        el.clientHeight,
      );

      // Resize handling — ResizeObserver catches container layout changes (e.g. sidebars)
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(el);
      window.addEventListener('resize', onResize);

      // Start render loop
      animationFrameId = requestAnimationFrame(animate);
    },

    setInstances(instances: FaceInstance[]): void {
      compositor.setInstances(instances);

      // Frame camera once on first data, then let user control it
      if (!hasFramedCamera && instances.length > 0) {
        lastPositions = instances.map(i => i.position);
        cameraController.frameAll(lastPositions);
        hasFramedCamera = true;
      }
    },

    highlightInstance(id: string | null): void {
      picker.highlightInstance(id);
    },

    selectInstance(id: string | null): void {
      picker.selectInstance(id);
    },

    getInstanceAtScreenPos(x: number, y: number): string | null {
      return picker.getInstanceAtScreenPos(x, y);
    },

    setCameraTarget(pos: [number, number, number]): void {
      cameraController.flyTo(pos);
    },

    projectToScreen(worldPos: [number, number, number]): { x: number; y: number; scale: number } | null {
      if (!container || !cameraController) return null;
      const cam = cameraController.camera;

      // Compute distance from camera to point (for scale)
      _projectVec.set(worldPos[0], worldPos[1], worldPos[2]);
      const distance = cam.position.distanceTo(_projectVec);
      if (distance < 0.001) return null;

      // Project to NDC
      _projectVec.project(cam);
      // Behind camera
      if (_projectVec.z > 1) return null;

      const w = container.clientWidth;
      const h = container.clientHeight;

      // Pixels-per-world-unit at this depth
      const fovRad = (cam.fov * Math.PI) / 180;
      const scale = (h / 2) / (distance * Math.tan(fovRad / 2));

      return {
        x: (_projectVec.x * 0.5 + 0.5) * w,
        y: (-_projectVec.y * 0.5 + 0.5) * h,
        scale,
      };
    },

    dispose(): void {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      resizeObserver?.disconnect();
      resizeObserver = null;
      window.removeEventListener('resize', onResize);
      picker.dispose();
      compositor.dispose();
      cameraController.dispose();
      renderer.dispose();
      if (container && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };

  return faceRenderer;
}
