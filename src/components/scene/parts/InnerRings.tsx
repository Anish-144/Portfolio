import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, type Group, type InstancedMesh } from 'three';
import {
  TAU,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  segment,
} from '../../../animation/easing';
import {
  createMachinedRing,
  createRibbedBand,
  createSegmentedRing,
  latheToPlaneAngle,
  type SegmentSpec,
} from '../geometry';
import { useDisposable } from '../useDisposable';
import { Conduits, Iris } from './Details';
import { layoutInstances, type PartProps } from './shared';

/* ------------------------------------------------------------------ Collar */

const COLLAR = { inner: 0.93, outer: 1.04, depth: 0.42, ribs: 7, ribDepth: 0.018 } as const;
const COLLAR_KEYS = 6;
const COLLAR_FACE_RADIUS = (COLLAR.inner + COLLAR.outer) / 2;

/** Ribbed steel collar hugging the core, keyed so its rotation reads. */
export function Collar({ clock, materials, quality }: PartProps) {
  const group = useRef<Group>(null);
  const keys = useRef<InstancedMesh>(null);

  const geometry = useDisposable(
    () => ({
      band: createRibbedBand(COLLAR, quality.radialSegments),
      key: new BoxGeometry(0.08, 0.05, 0.05),
      index: new BoxGeometry(0.012, 0.08, 0.01),
    }),
    [quality.radialSegments],
  );

  useLayoutEffect(() => {
    const mesh = keys.current;
    if (!mesh) return;
    layoutInstances(mesh, COLLAR_KEYS, (index, target) => {
      const angle = (index / COLLAR_KEYS) * TAU + TAU / (COLLAR_KEYS * 2);
      target.position.set(
        Math.cos(angle) * COLLAR_FACE_RADIUS,
        Math.sin(angle) * COLLAR_FACE_RADIUS,
        COLLAR.depth / 2 + 0.02,
      );
      target.rotation.z = angle;
    });
  }, [geometry]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const intro = easeOutCubic(segment(clock.intro, 0.12, 0.6));
    const explode = clock.journey.explode;
    g.position.z = lerp(0.9, 0, intro) + 0.85 * explode;
    g.rotation.z = clock.time * 0.11 + (1 - intro) * 1.4;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry.band} material={materials.steel} />
      <instancedMesh ref={keys} args={[geometry.key, materials.chrome, COLLAR_KEYS]} />
      <mesh
        geometry={geometry.index}
        material={materials.amber}
        position={[0, COLLAR_FACE_RADIUS, COLLAR.depth / 2 + 0.006]}
      />
      <Iris clock={clock} materials={materials} quality={quality} />
    </group>
  );
}

/* ----------------------------------------------------------- Segment ring */

const SEGMENT_PROFILE = { inner: 1.28, outer: 1.66, depth: 0.2, chamfer: 0.035 } as const;
const SEGMENT_LAYOUT: readonly SegmentSpec[] = [
  { span: 2, variant: 0 },
  { span: 1, variant: 1 },
  { span: 1, variant: 1 },
  { span: 2, variant: 0 },
  { span: 1, variant: 1 },
  { span: 2, variant: 0 },
  { span: 1, variant: 1 },
  { span: 1, variant: 1 },
  { span: 1, variant: 1 },
];
const SLOT_ANGLE = TAU / SEGMENT_LAYOUT.reduce((total, spec) => total + spec.span, 0);
const LAMP_SEGMENTS = [0, 3, 5];
const STEP_PERIOD = 4.2;
const STEP_MOVE = 1.15;

/** Indexing motion: hold, then advance exactly one slot with an eased move. */
function indexedAngle(time: number): number {
  const cycles = time / STEP_PERIOD;
  const completed = Math.floor(cycles);
  const into = (cycles - completed) * STEP_PERIOD;
  const move = into < STEP_PERIOD - STEP_MOVE ? 0 : easeInOutCubic((into - (STEP_PERIOD - STEP_MOVE)) / STEP_MOVE);
  return -(completed + move) * SLOT_ANGLE;
}

/** Machined arc segments in two finishes that index around like a rotary table. */
const VENTS_PER_SEGMENT = 4;
const VENT_SPREAD = 0.035;
const SEGMENT_GAP = 0.05;
const END_BOLT_RADIUS = 1.615;

export function SegmentRing({ clock, materials, quality }: PartProps) {
  const group = useRef<Group>(null);
  const vents = useRef<InstancedMesh>(null);
  const bolts = useRef<InstancedMesh>(null);

  const geometry = useDisposable(() => {
    const ring = createSegmentedRing(SEGMENT_PROFILE, SEGMENT_LAYOUT, SEGMENT_GAP, quality.radialSegments);
    return {
      polished: ring.geometries[0],
      dark: ring.geometries[1],
      lamp: new BoxGeometry(0.15, 0.026, 0.01),
      vent: new BoxGeometry(0.1, 0.012, 0.008),
      bolt: new CylinderGeometry(0.017, 0.017, 0.016, 6).rotateX(Math.PI / 2),
      centers: ring.centers,
    };
  }, [quality.radialSegments]);

  // Radial slots, cut into the inner half of every segment.
  useLayoutEffect(() => {
    const mesh = vents.current;
    if (!mesh) return;
    const centers = geometry.centers;
    layoutInstances(mesh, centers.length * VENTS_PER_SEGMENT, (index, target) => {
      const center = latheToPlaneAngle(centers[Math.floor(index / VENTS_PER_SEGMENT)] ?? 0);
      const angle = center + ((index % VENTS_PER_SEGMENT) - (VENTS_PER_SEGMENT - 1) / 2) * VENT_SPREAD;
      const radius = 1.4;
      target.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, SEGMENT_PROFILE.depth / 2 + 0.002);
      target.rotation.z = angle;
    });

    // A hex bolt near each end of every segment, on the outer band of the face.
    const boltMesh = bolts.current;
    if (!boltMesh) return;
    layoutInstances(boltMesh, centers.length * 2, (index, target) => {
      const segmentIndex = Math.floor(index / 2);
      const span = SEGMENT_LAYOUT[segmentIndex]?.span ?? 1;
      const half = (span * SLOT_ANGLE - SEGMENT_GAP) / 2 - 0.045;
      const angle = latheToPlaneAngle(centers[segmentIndex] ?? 0) + (index % 2 === 0 ? -half : half);
      target.position.set(
        Math.cos(angle) * END_BOLT_RADIUS,
        Math.sin(angle) * END_BOLT_RADIUS,
        SEGMENT_PROFILE.depth / 2 + 0.008,
      );
      target.rotation.z = angle;
    });
  }, [geometry]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const intro = easeOutCubic(segment(clock.intro, 0.05, 0.7));
    const explode = clock.journey.explode;
    g.position.z = lerp(-0.5, 0, intro) - 0.5 * explode;
    g.rotation.z = indexedAngle(clock.time) + (1 - intro) * 0.9;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry.polished} material={materials.steel} />
      <mesh geometry={geometry.dark} material={materials.gunmetal} />
      <instancedMesh
        ref={vents}
        args={[geometry.vent, materials.blackened, geometry.centers.length * VENTS_PER_SEGMENT]}
      />
      <instancedMesh ref={bolts} args={[geometry.bolt, materials.chrome, geometry.centers.length * 2]} />
      {LAMP_SEGMENTS.map((segmentIndex) => {
        const angle = latheToPlaneAngle(geometry.centers[segmentIndex] ?? 0);
        return (
          <mesh
            key={segmentIndex}
            geometry={geometry.lamp}
            material={materials.amber}
            position={[Math.cos(angle) * 1.58, Math.sin(angle) * 1.58, SEGMENT_PROFILE.depth / 2 + 0.004]}
            rotation-z={angle + Math.PI / 2}
          />
        );
      })}
    </group>
  );
}

/* --------------------------------------------------------------- Fin ring */

const FIN_INNER_RACE = { inner: 1.84, outer: 1.91, depth: 0.32, chamfer: 0.012 } as const;
const FIN_OUTER_RACE = { inner: 2.28, outer: 2.35, depth: 0.32, chamfer: 0.012 } as const;
const FIN = { radius: 2.095, length: 0.37, thickness: 0.014, depth: 0.25, pitch: 0.55 } as const;
/** Stator row: shorter vanes pitched the other way, behind the rotor. */
const STATOR = { z: -0.23, length: 0.34, thickness: 0.012, depth: 0.1, pitch: -0.6 } as const;
const FRAME_Z = -0.31;
const FRAME_STRUTS = 8;

/**
 * Turbine stage. The rotor (two machined races, pitched blades, bolt circles)
 * spins one way; behind it, a stator row on an open spoked frame turns slowly
 * the other way, carrying the coolant loops.
 */
export function FinRing({ clock, materials, quality }: PartProps) {
  const group = useRef<Group>(null);
  const rotor = useRef<Group>(null);
  const stator = useRef<Group>(null);
  const fins = useRef<InstancedMesh>(null);
  const vanes = useRef<InstancedMesh>(null);
  const struts = useRef<InstancedMesh>(null);
  const bolts = useRef<InstancedMesh>(null);
  const count = quality.finCount;
  const vaneCount = quality.statorCount;
  const outerBolts = quality.raceBolts;
  const innerBolts = Math.round(quality.raceBolts * 0.75);

  const geometry = useDisposable(
    () => ({
      innerRace: createMachinedRing(FIN_INNER_RACE, quality.radialSegments),
      outerRace: createMachinedRing(FIN_OUTER_RACE, quality.radialSegments),
      fin: new BoxGeometry(FIN.length, FIN.thickness, FIN.depth),
      vane: new BoxGeometry(STATOR.length, STATOR.thickness, STATOR.depth),
      frameInner: createMachinedRing({ inner: 1.87, outer: 1.92, depth: 0.03, chamfer: 0.008 }, quality.radialSegments),
      frameOuter: createMachinedRing({ inner: 2.29, outer: 2.34, depth: 0.03, chamfer: 0.008 }, quality.radialSegments),
      strut: new BoxGeometry(0.42, 0.03, 0.026),
      bolt: new CylinderGeometry(0.016, 0.016, 0.016, 6).rotateX(Math.PI / 2),
    }),
    [quality.radialSegments],
  );

  useLayoutEffect(() => {
    const finMesh = fins.current;
    const vaneMesh = vanes.current;
    const strutMesh = struts.current;
    const boltMesh = bolts.current;
    if (!finMesh || !vaneMesh || !strutMesh || !boltMesh) return;
    layoutInstances(finMesh, count, (index, target) => {
      const angle = (index / count) * TAU;
      target.position.set(Math.cos(angle) * FIN.radius, Math.sin(angle) * FIN.radius, 0);
      target.rotation.z = angle;
      target.rotateX(FIN.pitch);
    });
    layoutInstances(vaneMesh, vaneCount, (index, target) => {
      const angle = (index / vaneCount) * TAU;
      target.position.set(Math.cos(angle) * FIN.radius, Math.sin(angle) * FIN.radius, STATOR.z);
      target.rotation.z = angle;
      target.rotateX(STATOR.pitch);
    });
    layoutInstances(strutMesh, FRAME_STRUTS, (index, target) => {
      const angle = (index / FRAME_STRUTS) * TAU + 0.2;
      target.position.set(Math.cos(angle) * 2.105, Math.sin(angle) * 2.105, FRAME_Z);
      target.rotation.z = angle;
    });
    // Bolt circles on the front faces of both races.
    layoutInstances(boltMesh, outerBolts + innerBolts, (index, target) => {
      const outer = index < outerBolts;
      const share = outer ? index / outerBolts : (index - outerBolts) / innerBolts;
      const angle = share * TAU + (outer ? 0 : 0.11);
      const radius = outer ? 2.315 : 1.875;
      target.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, FIN_OUTER_RACE.depth / 2 + 0.008);
    });
  }, [geometry, count, vaneCount, outerBolts, innerBolts]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const intro = easeOutCubic(segment(clock.intro, 0.1, 0.62));
    const explode = clock.journey.explode;
    g.position.z = lerp(-1.4, 0, intro) - 1.3 * explode;
    if (rotor.current) rotor.current.rotation.z = -clock.time * 0.055 - (1 - intro) * 0.8;
    if (stator.current) {
      stator.current.rotation.z = clock.time * 0.025 + (1 - intro) * 0.6;
      // In the exploded view the stator stage separates from the rotor.
      stator.current.position.z = -0.45 * explode;
    }
  });

  return (
    <group ref={group}>
      <group ref={rotor}>
        <mesh geometry={geometry.innerRace} material={materials.chrome} />
        <mesh geometry={geometry.outerRace} material={materials.steel} />
        <instancedMesh ref={fins} args={[geometry.fin, materials.gunmetal, count]} />
        <instancedMesh ref={bolts} args={[geometry.bolt, materials.chrome, outerBolts + innerBolts]} />
      </group>
      <group ref={stator}>
        <instancedMesh ref={vanes} args={[geometry.vane, materials.steel, vaneCount]} />
        <mesh geometry={geometry.frameInner} material={materials.gunmetal} position-z={FRAME_Z} />
        <mesh geometry={geometry.frameOuter} material={materials.gunmetal} position-z={FRAME_Z} />
        <instancedMesh ref={struts} args={[geometry.strut, materials.gunmetal, FRAME_STRUTS]} />
        <Conduits clock={clock} materials={materials} quality={quality} />
      </group>
    </group>
  );
}

/* ----------------------------------------------------------- Ball bearing */

const BEARING_INNER = { inner: 1.085, outer: 1.135, depth: 0.12, chamfer: 0.012 } as const;
const BEARING_OUTER = { inner: 1.215, outer: 1.265, depth: 0.12, chamfer: 0.012 } as const;
const BALL_PITCH = 1.175;
const BALL_RADIUS = 0.038;

/**
 * Ball bearing between the collar and the indexing ring: the inner race turns
 * with the collar, the outer race stays put, and the balls and their cage
 * roll round at half the inner race's speed, as a real bearing does.
 */
export function Bearing({ clock, materials, quality }: PartProps) {
  const group = useRef<Group>(null);
  const innerRace = useRef<Group>(null);
  const cage = useRef<Group>(null);
  const balls = useRef<InstancedMesh>(null);
  const count = quality.bearingBalls;

  const geometry = useDisposable(
    () => ({
      inner: createMachinedRing(BEARING_INNER, quality.radialSegments),
      outer: createMachinedRing(BEARING_OUTER, quality.radialSegments),
      ball: new SphereGeometry(BALL_RADIUS, 18, 12),
      cage: new TorusGeometry(BALL_PITCH, 0.0045, 6, quality.radialSegments),
    }),
    [quality.radialSegments],
  );

  useLayoutEffect(() => {
    const mesh = balls.current;
    if (!mesh) return;
    layoutInstances(mesh, count, (index, target) => {
      const angle = (index / count) * TAU;
      target.position.set(Math.cos(angle) * BALL_PITCH, Math.sin(angle) * BALL_PITCH, 0);
    });
  }, [geometry, count]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const intro = easeOutCubic(segment(clock.intro, 0.08, 0.65));
    g.position.z = lerp(-0.3, 0, intro) - 0.15 * clock.journey.explode;
    const turn = clock.time * 0.11 + (1 - intro) * 1.4;
    if (innerRace.current) innerRace.current.rotation.z = turn;
    if (cage.current) cage.current.rotation.z = turn / 2;
  });

  return (
    <group ref={group}>
      <group ref={innerRace}>
        <mesh geometry={geometry.inner} material={materials.chrome} />
      </group>
      <mesh geometry={geometry.outer} material={materials.steel} />
      <group ref={cage}>
        <instancedMesh ref={balls} args={[geometry.ball, materials.chrome, count]} />
        <mesh geometry={geometry.cage} material={materials.gunmetal} position-z={0.042} />
        <mesh geometry={geometry.cage} material={materials.gunmetal} position-z={-0.042} />
      </group>
    </group>
  );
}
