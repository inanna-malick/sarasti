import * as THREE from 'three';

/**
 * Warm off-white teeth. Glossy, slight emissive glow.
 */
export function createTeethMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xF5F0E8,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0xF0E8D8,
    emissiveIntensity: 0.3,
  });
}

/**
 * Desaturated pink gum tissue. Wet look.
 */
export function createGumsMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x8B5E6B,
    roughness: 0.4,
    metalness: 0.0,
    emissive: 0x3A2530,
    emissiveIntensity: 0.2,
  });
}

/**
 * Darker pink tongue surface.
 */
export function createTongueMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x7B4B5A,
    roughness: 0.5,
    metalness: 0.0,
    emissive: 0x2A1520,
    emissiveIntensity: 0.15,
  });
}

/**
 * Near-black warm brown cavity backdrop. Unlit for infinite depth illusion.
 */
export function createCavityMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: 0x1A0F0A,
  });
}
