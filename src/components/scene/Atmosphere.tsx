import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from 'three';
import { AMBER } from './materials';
import type { QualitySettings } from './quality';
import type { SceneClock } from './sceneClock';
import { useDisposable } from './useDisposable';

const INNER_RADIUS = 2.4;
const OUTER_RADIUS = 7.5;

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uLevel;
  attribute float aSeed;
  varying float vAlpha;
  varying float vWarm;

  void main() {
    // A slow drift around the vertical axis, plus a lazy wander of its own.
    vec3 p = position;
    float turn = uTime * (0.01 + 0.025 * fract(aSeed * 13.7));
    float c = cos(turn);
    float s = sin(turn);
    p.xz = vec2(c * p.x - s * p.z, s * p.x + c * p.z);
    p += 0.2 * vec3(sin(uTime * 0.21 + aSeed * 31.0), sin(uTime * 0.17 + aSeed * 17.0), cos(uTime * 0.19 + aSeed * 23.0));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = min(uSize * (0.3 + fract(aSeed * 7.31)) / depth, uSize * 0.06);

    float twinkle = 0.55 + 0.45 * sin(uTime * (0.5 + fract(aSeed * 3.1)) + aSeed * 50.0);
    // Motes close to the lens would read as blurry blobs: fade them out.
    vAlpha = uLevel * twinkle * smoothstep(2.0, 5.0, depth);
    vWarm = step(0.86, fract(aSeed * 11.3));
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uCool;
  uniform vec3 uWarm;
  varying float vAlpha;
  varying float vWarm;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(mix(uCool, uWarm, vWarm), a);
    #include <colorspace_fragment>
  }
`;

/**
 * Dust hanging in the studio light around the sculpture: a few hundred
 * motes in a loose shell, drifting and twinkling, mostly cool with the odd
 * warm spark. World-anchored, so they parallax as the camera orbits.
 */
export function Atmosphere({ clock, quality }: { clock: SceneClock; quality: QualitySettings }) {
  const count = quality.dustCount;
  const dpr = useThree((state) => state.viewport.dpr);

  const resources = useDisposable(() => {
    let seed = 4271;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      // Uniform direction, radius biased outward so the shell isn't crowded near the metal.
      const y = random() * 2 - 1;
      const angle = random() * Math.PI * 2;
      const ring = Math.sqrt(1 - y * y);
      const radius = INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * Math.sqrt(random());
      positions.set([Math.cos(angle) * ring * radius, y * radius * 0.7, Math.sin(angle) * ring * radius], index * 3);
      seeds[index] = random();
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
    const material = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 60 },
        uLevel: { value: 0 },
        uCool: { value: new Color('#b9c3d6') },
        uWarm: { value: new Color(AMBER) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
    });
    return { geometry, material };
  }, [count]);

  useFrame(() => {
    const { uniforms } = resources.material;
    if (uniforms.uTime) uniforms.uTime.value = clock.time;
    if (uniforms.uSize) uniforms.uSize.value = 70 * dpr;
    if (uniforms.uLevel) uniforms.uLevel.value = 0.6 * clock.lights * (0.4 + 0.6 * clock.journey.level);
  });

  return <points geometry={resources.geometry} material={resources.material} frustumCulled={false} />;
}
