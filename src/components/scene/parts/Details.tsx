import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  MeshBasicMaterial,
  Object3D,
  QuadraticBezierCurve3,
  Quaternion,
  RingGeometry,
  ShaderMaterial,
  Shape,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TAU, clamp01, easeInOutSine, easeOutCubic, lerp } from '../../../animation/easing';
import { AMBER } from '../materials';
import { useDisposable } from '../useDisposable';
import { layoutInstances, type PartProps } from './shared';

const scratch = new Object3D();

/* ------------------------------------------------------------------- Iris */

const BLADES = 10;
const BLADE_PIVOT = 0.95;
/** Just in front of the collar's front face. */
const IRIS_Z = 0.245;

/** A curved shutter blade; its pivot sits at the origin, the blade runs along +X. */
function createBlade(): ExtrudeGeometry {
  const shape = new Shape();
  shape.moveTo(0, -0.13);
  shape.quadraticCurveTo(0.25, -0.2, 0.47, -0.05);
  shape.lineTo(0.48, 0.1);
  shape.quadraticCurveTo(0.26, 0.05, 0, 0.15);
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false, curveSegments: 14 });
}

/**
 * Camera-style iris over the core. Blades swing about pivots on the collar's
 * rim: open, they lie flat along the rim; closed, they meet in a pupil.
 * Each journey station sets the aperture; it breathes slowly at rest.
 */
export function Iris({ clock, materials }: PartProps) {
  const blades = useRef<InstancedMesh>(null);
  const geometry = useDisposable(() => ({ blade: createBlade() }), []);

  useFrame(() => {
    const mesh = blades.current;
    if (!mesh) return;
    const open = clamp01(clock.journey.aperture + Math.sin(clock.time * 0.7) * 0.03 * clock.journey.aperture);
    const swing = lerp(0.3, 1.5, easeInOutSine(open));
    for (let index = 0; index < BLADES; index++) {
      const angle = (index / BLADES) * TAU;
      scratch.position.set(Math.cos(angle) * BLADE_PIVOT, Math.sin(angle) * BLADE_PIVOT, IRIS_Z + index * 0.003);
      scratch.rotation.set(0, 0, angle + Math.PI + swing);
      scratch.scale.setScalar(1);
      scratch.updateMatrix();
      mesh.setMatrixAt(index, scratch.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={blades} args={[geometry.blade, materials.blackened, BLADES]} frustumCulled={false} />;
}

/* --------------------------------------------------------------- Data bus */

const BUS_RADIUS = 2.42;
const PACKETS = 3;
const PACKET_TAIL = 6;

/**
 * A ring of memory blocks between the fin ring and the gear race. Amber
 * packets chase around it; stations set how busy it is.
 */
export function DataBus({ clock, quality }: PartProps) {
  const spin = useRef<Group>(null);
  const blocks = useRef<InstancedMesh>(null);
  const count = quality.busCount;
  const resources = useDisposable(
    () => ({
      block: new BoxGeometry(0.075, 0.032, 0.045),
      material: new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
    }),
    [],
  );
  const palette = useMemo(() => ({ off: new Color('#24272c'), on: new Color(AMBER), mix: new Color() }), []);

  useLayoutEffect(() => {
    const mesh = blocks.current;
    if (!mesh) return;
    layoutInstances(mesh, count, (index, target) => {
      const angle = (index / count) * TAU;
      target.position.set(Math.cos(angle) * BUS_RADIUS, Math.sin(angle) * BUS_RADIUS, 0);
      target.rotation.z = angle;
    });
    for (let index = 0; index < count; index++) mesh.setColorAt(index, palette.off);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, palette, resources]);

  useFrame(() => {
    const mesh = blocks.current;
    if (spin.current) spin.current.rotation.z = -clock.time * 0.02;
    if (!mesh) return;
    const activity = clock.journey.bus * clock.power;
    const head = clock.time * (3 + 9 * clock.journey.bus);
    for (let index = 0; index < count; index++) {
      let glow = 0;
      for (let packet = 0; packet < PACKETS; packet++) {
        const position = (head + (packet * count) / PACKETS) % count;
        const behind = (position - index + count) % count;
        if (behind < PACKET_TAIL) glow = Math.max(glow, 1 - behind / PACKET_TAIL);
      }
      palette.mix.copy(palette.off).lerp(palette.on, glow * glow * activity);
      mesh.setColorAt(index, palette.mix);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group ref={spin}>
      <instancedMesh ref={blocks} args={[resources.block, resources.material, count]} />
    </group>
  );
}

/* --------------------------------------------------------------- Conduits */

const CONDUIT_INNER = 1.9;
const CONDUIT_OUTER = 2.32;
const CONDUIT_BACK = -0.16;

const polar = (radius: number, angle: number, z: number) =>
  new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);

/**
 * Braided coolant loops on the back of the fin ring, from the inner race out
 * and around to the outer race. Mostly seen in side and exploded views.
 */
export function Conduits({ materials, quality }: PartProps) {
  const fittings = useRef<InstancedMesh>(null);
  const count = quality.conduitCount;

  const resources = useDisposable(() => {
    const curves = Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * TAU + 0.3;
      return new QuadraticBezierCurve3(
        polar(CONDUIT_INNER, angle, CONDUIT_BACK),
        polar((CONDUIT_INNER + CONDUIT_OUTER) / 2, angle + 0.16, CONDUIT_BACK - 0.5),
        polar(CONDUIT_OUTER, angle + 0.32, CONDUIT_BACK),
      );
    });
    const tubes = curves.map((curve) => new TubeGeometry(curve, 28, 0.024, 8, false));
    const merged = mergeGeometries(tubes);
    tubes.forEach((tube) => tube.dispose());
    return { tubes: merged ?? new BufferGeometry(), fitting: new TorusGeometry(0.036, 0.011, 8, 18), curves };
  }, [count]);

  useLayoutEffect(() => {
    const mesh = fittings.current;
    if (!mesh) return;
    const up = new Vector3(0, 0, 1);
    const tangent = new Vector3();
    const orientation = new Quaternion();
    layoutInstances(mesh, count * 2, (index, target) => {
      const curve = resources.curves[Math.floor(index / 2)];
      if (!curve) return;
      const t = index % 2 === 0 ? 0.04 : 0.96;
      target.position.copy(curve.getPoint(t));
      curve.getTangent(t, tangent);
      orientation.setFromUnitVectors(up, tangent.normalize());
      target.quaternion.copy(orientation);
    });
  }, [count, resources]);

  return (
    <group>
      <mesh geometry={resources.tubes} material={materials.steel} />
      <instancedMesh ref={fittings} args={[resources.fitting, materials.chrome, count * 2]} />
    </group>
  );
}

/* ------------------------------------------------------------ Data stream */

const STREAM_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uFlow;
  uniform float uSize;
  attribute float aSeed;
  attribute float aSpeed;
  varying float vAlpha;
  varying float vWarm;

  void main() {
    float t = fract(uTime * aSpeed + aSeed);
    float radius = mix(3.3, 0.72, pow(t, 1.35));
    float angle = aSeed * 6.2831853 + t * 3.4;
    float lift = sin(aSeed * 41.0) * 0.55 * (1.0 - t);
    vec4 mv = modelViewMatrix * vec4(cos(angle) * radius, sin(angle) * radius, lift, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.55 + 0.45 * (1.0 - t)) / -mv.z;
    vAlpha = uFlow * smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.82, 1.0, t));
    vWarm = step(0.7, fract(aSeed * 7.31));
  }
`;

const STREAM_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  varying float vWarm;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.12, d) * vAlpha;
    if (a < 0.01) discard;
    vec3 color = mix(vec3(0.82, 0.85, 0.9), vec3(1.0, 0.64, 0.24), vWarm);
    gl_FragColor = vec4(color, a);
  }
`;

/**
 * Particles spiralling in through the rings toward the core, computed on the
 * GPU. Stations set the density: absent in the hero, strongest in Projects.
 */
export function DataStream({ clock, quality }: PartProps) {
  const count = quality.streamCount;
  const dpr = useThree((state) => state.viewport.dpr);

  const resources = useDisposable(() => {
    const geometry = new BufferGeometry();
    const seeds = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      seeds[index] = (index * 0.618034) % 1;
      speeds[index] = 0.05 + ((index * 0.37) % 1) * 0.07;
    }
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
    geometry.setAttribute('aSpeed', new BufferAttribute(speeds, 1));
    const material = new ShaderMaterial({
      vertexShader: STREAM_VERTEX,
      fragmentShader: STREAM_FRAGMENT,
      uniforms: { uTime: { value: 0 }, uFlow: { value: 0 }, uSize: { value: 60 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { geometry, material };
  }, [count]);

  useFrame(() => {
    const { uniforms } = resources.material;
    if (uniforms.uTime) uniforms.uTime.value = clock.time;
    if (uniforms.uFlow) uniforms.uFlow.value = clock.journey.flow * clock.power;
    if (uniforms.uSize) uniforms.uSize.value = 84 * dpr;
  });

  return <points geometry={resources.geometry} material={resources.material} frustumCulled={false} />;
}

/* ---------------------------------------------------------- Arrival pulse */

const PULSE_SECONDS = 1.8;
const PULSE_RINGS = 2;

/**
 * Each time the journey arrives at a new section, a thin amber shockwave
 * runs out through the ring plane. Off under reduced motion.
 */
export function ArrivalPulse({ clock }: PartProps) {
  const rings = useRef<Array<Mesh | null>>([]);
  const lastStation = useRef(-1);
  const progress = useRef(1);

  const resources = useDisposable(() => {
    const material = () =>
      new MeshBasicMaterial({
        color: AMBER,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
        side: DoubleSide,
      });
    return { ring: new RingGeometry(1, 1.012, 160), lead: material(), trail: material() };
  }, []);

  useFrame((_, delta) => {
    const station = clock.journey.station;
    if (lastStation.current === -1) lastStation.current = station;
    else if (station !== lastStation.current) {
      lastStation.current = station;
      if (!clock.still) progress.current = 0;
    }
    if (progress.current < 1) progress.current = Math.min(1, progress.current + Math.min(delta, 1 / 30) / PULSE_SECONDS);

    rings.current.forEach((ring, index) => {
      if (!ring) return;
      const t = clamp01(progress.current * 1.3 - index * 0.3);
      const active = progress.current < 1 && t > 0 && t < 1;
      ring.visible = active;
      if (!active) return;
      ring.scale.setScalar(lerp(1.1, 4.6, easeOutCubic(t)));
      (ring.material as MeshBasicMaterial).opacity = 0.55 * (1 - t) ** 2 * clock.power;
    });
  });

  return (
    <group>
      {Array.from({ length: PULSE_RINGS }, (_, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            rings.current[index] = mesh;
          }}
          geometry={resources.ring}
          material={index === 0 ? resources.lead : resources.trail}
          visible={false}
        />
      ))}
    </group>
  );
}
