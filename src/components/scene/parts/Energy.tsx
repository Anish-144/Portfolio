import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, DoubleSide, RingGeometry, ShaderMaterial, SphereGeometry } from 'three';
import { smoothstep } from '../../../animation/easing';
import { AMBER } from '../materials';
import { useDisposable } from '../useDisposable';
import type { PartProps } from './shared';

/* ------------------------------------------------------------ Core traces */

/** Just above the obsidian sphere (0.6), inside the filament and gyro. */
const TRACE_RADIUS = 0.604;

const TRACE_VERTEX = /* glsl */ `
  varying vec3 vDirection;
  varying float vFacing;

  void main() {
    vDirection = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFacing = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv;
  }
`;

const TRACE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uLevel;
  uniform vec3 uColor;
  varying vec3 vDirection;
  varying float vFacing;

  const float PI = 3.14159265;
  const float CELLS = 30.0;
  const float ROWS = 15.0;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float line(float distance, float width, float aa) {
    return 1.0 - smoothstep(width, width + aa, distance);
  }

  void main() {
    vec3 d = normalize(vDirection);
    float u = atan(d.z, d.x) / (2.0 * PI) + 0.5;
    float v = acos(clamp(d.y, -1.0, 1.0)) / PI;
    vec2 grid = vec2(u * CELLS, v * ROWS);
    vec2 cell = floor(grid);
    vec2 f = fract(grid);
    // Derivatives of a seam-free copy of u, so the atan wrap doesn't smear a line.
    vec2 aa = vec2(min(fwidth(u), fwidth(fract(u + 0.5))) * CELLS, fwidth(grid.y)) * 1.2;

    // Horizontal runs through the middle of each row, present in some cells.
    float run = step(0.4, hash(cell)) * line(abs(f.y - 0.5), 0.035, aa.y);

    // Vertical links on cell edges, joining one row's run to the next.
    float edge = f.x < 0.5 ? cell.x : cell.x + 1.0;
    float row = f.y > 0.5 ? cell.y : cell.y - 1.0;
    float link = step(0.8, hash(vec2(edge, row) + 17.0)) * line(min(f.x, 1.0 - f.x), 0.035, aa.x);

    // A data pulse runs along every row, alternating direction.
    float speed = (0.035 + 0.05 * hash(vec2(cell.y, 3.0))) * (mod(cell.y, 2.0) < 1.0 ? 1.0 : -1.0);
    float head = fract(uTime * speed + hash(vec2(cell.y, 9.0)));
    float behind = fract((head - u) * sign(speed));
    float pulse = exp(-behind * 22.0);

    float traces = max(run, link);
    float intensity = traces * (0.16 + 1.8 * pulse * run) * smoothstep(0.05, 0.45, vFacing) * uLevel;
    if (intensity < 0.002) discard;
    // Capped along its own hue, so a pulse peaks at full amber instead of clipping toward yellow.
    vec3 light = uColor * intensity;
    gl_FragColor = vec4(light / max(1.0, max(light.r, max(light.g, light.b))), 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Amber circuitry on the core's black glass: thin runs and links, with a data
 * pulse racing along each row. Seen through the shell's slit at rest, and in
 * full when the shell parts.
 */
export function CoreTraces({ clock }: PartProps) {
  const resources = useDisposable(
    () => ({
      geometry: new SphereGeometry(TRACE_RADIUS, 96, 64),
      material: new ShaderMaterial({
        vertexShader: TRACE_VERTEX,
        fragmentShader: TRACE_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uLevel: { value: 0 },
          uColor: { value: new Color(AMBER) },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    }),
    [],
  );

  useFrame(() => {
    const { uniforms } = resources.material;
    if (uniforms.uTime) uniforms.uTime.value = clock.time;
    if (uniforms.uLevel) uniforms.uLevel.value = clock.power * (1 + 1.4 * clock.surge);
  });

  return <mesh geometry={resources.geometry} material={resources.material} />;
}

/* ------------------------------------------------------------- Slit light */

const SHEET_INNER = 0.66;
const SHEET_OUTER = 2.1;

const SHEET_VERTEX = /* glsl */ `
  varying vec2 vPlane;

  void main() {
    // The ring is laid flat in the equatorial (XZ) plane.
    vPlane = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHEET_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uLevel;
  uniform vec3 uColor;
  varying vec2 vPlane;

  void main() {
    float r = length(vPlane);
    float angle = atan(vPlane.y, vPlane.x);
    float falloff = exp(-(r - ${SHEET_INNER.toFixed(2)}) * 3.4) * smoothstep(${SHEET_OUTER.toFixed(2)}, 1.3, r);
    // Slowly turning rays, like light leaking through uneven gaps.
    float rays = 0.5 + 0.5 * sin(angle * 11.0 + uTime * 0.45) * sin(angle * 5.0 - uTime * 0.3 + 1.7);
    float intensity = falloff * (0.35 + 0.65 * rays) * uLevel;
    if (intensity < 0.002) discard;
    // Premultiplied: coverage follows brightness, so the sheet never blacks out the page behind it.
    vec3 light = uColor * intensity;
    light /= max(1.0, max(light.r, max(light.g, light.b)));
    gl_FragColor = vec4(light, max(light.r, max(light.g, light.b)));
    #include <colorspace_fragment>
  }
`;

/**
 * When the shell parts, light spills out of the equatorial gap as a thin,
 * rayed sheet. Dark while the shell is closed.
 */
export function SlitLight({ clock }: PartProps) {
  const resources = useDisposable(
    () => ({
      geometry: new RingGeometry(SHEET_INNER, SHEET_OUTER, 128, 1).rotateX(-Math.PI / 2),
      material: new ShaderMaterial({
        vertexShader: SHEET_VERTEX,
        fragmentShader: SHEET_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uLevel: { value: 0 },
          uColor: { value: new Color(AMBER).multiplyScalar(0.4) },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        premultipliedAlpha: true,
        side: DoubleSide,
        toneMapped: false,
      }),
    }),
    [],
  );

  useFrame(() => {
    const { uniforms } = resources.material;
    const open = smoothstep(0.08, 0.5, clock.journey.explode);
    if (uniforms.uTime) uniforms.uTime.value = clock.time;
    if (uniforms.uLevel) uniforms.uLevel.value = open * clock.power * (1 + 1.2 * clock.surge);
  });

  return <mesh geometry={resources.geometry} material={resources.material} />;
}
