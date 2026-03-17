import * as THREE from 'three';

export interface EyeMaterialOptions {
  irisColor: THREE.Color;    // deterministic from ticker hash
  irisRadius?: number;       // default 0.26
  pupilRadius?: number;      // default 0.09
}

export function createEyeMaterial(options: EyeMaterialOptions): THREE.ShaderMaterial {
  const irisRadius = options.irisRadius ?? 0.26;
  const pupilRadius = options.pupilRadius ?? 0.09;

  const vertexShader = `
    varying vec3 vLocalPos;
    varying vec3 vNormal;
    varying vec2 vEyeUV;
    varying float vY;
    
    uniform vec3 eyeCenter;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vLocalPos = position - eyeCenter;
      vY = position.y;
      
      // Project onto eye sphere surface. 
      // We assume the eye looks towards +Z in local space.
      vec3 dir = normalize(vLocalPos);
      vEyeUV = dir.xy;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec3 vLocalPos;
    varying vec3 vNormal;
    varying vec2 vEyeUV;
    varying float vY;

    uniform vec3 irisColor;
    uniform float irisRadius;
    uniform float pupilRadius;
    uniform vec2 gazeOffset;

    // Simple noise for veins
    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    float noise(vec3 x) {
      vec3 p = floor(x);
      vec3 f = fract(x);
      f = f*f*(3.0-2.0*f);
      float n = p.x + p.y*57.0 + 113.0*p.z;
      return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                     mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                 mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                     mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
    }

    void main() {
      // Distance from shifted eye center
      vec2 shiftedUV = vEyeUV - gazeOffset;
      float dist = length(shiftedUV);
      
      // Base color: Sclera (white)
      vec3 color = vec3(0.95, 0.95, 0.93);
      
      // Subtle veins using noise
      float n = noise(vLocalPos * 100.0);
      if (n > 0.8) {
        color = mix(color, vec3(0.8, 0.4, 0.4), (n - 0.8) * 0.5);
      }

      // Limbal ring (dark ring at the edge of the iris)
      float limbal = (1.0 - smoothstep(irisRadius, irisRadius + 0.015, dist)) * smoothstep(irisRadius - 0.03, irisRadius, dist);
      float limbalDarkness = limbal * 0.6;
      
      // Iris
      if (dist < irisRadius) {
        // Radial pattern for iris
        float angle = atan(shiftedUV.y, shiftedUV.x);
        float radial = 0.5 + 0.5 * sin(angle * 20.0 + noise(vLocalPos * 10.0) * 5.0);
        vec3 irisBase = mix(irisColor * 0.6, irisColor, radial);
        
        // Darken towards pupil (inner iris)
        irisBase *= (0.8 + 0.2 * smoothstep(pupilRadius, irisRadius, dist));
        
        float irisBlend = 1.0 - smoothstep(irisRadius - 0.01, irisRadius, dist);
        color = mix(color, irisBase, irisBlend);
      }
      
      // Pupil
      if (dist < pupilRadius) {
        float pupilBlend = 1.0 - smoothstep(pupilRadius - 0.005, pupilRadius, dist);
        color = mix(color, vec3(0.015), pupilBlend);
      }
      
      // Apply limbal darkness (properly centered on the edge)
      color = mix(color, vec3(0.0), limbalDarkness);

      // Fake specular highlight (upper-left)
      vec2 specPos = vec2(-0.04, 0.04) + gazeOffset * 0.5;
      float spec = smoothstep(0.02, 0.0, length(vEyeUV - specPos));
      color += spec * 0.4;

      // Simple lighting based on normal
      float l = max(0.3, dot(vNormal, normalize(vec3(0.5, 0.5, 1.0))));
      color *= l;

      // Alpha fade for neck
      float fadeStart = -0.08;
      float fadeEnd = -0.15;
      float alpha = smoothstep(fadeEnd, fadeStart, vY);

      gl_FragColor = vec4(color, alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {
      irisColor: { value: options.irisColor },
      irisRadius: { value: irisRadius },
      pupilRadius: { value: pupilRadius },
      gazeOffset: { value: new THREE.Vector2(0, 0) },
      eyeCenter: { value: new THREE.Vector3(0, 0, 0) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
  });
}
