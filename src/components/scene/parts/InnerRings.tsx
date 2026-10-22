import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, type Group, type InstancedMesh } from 'three';
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

export function SegmentRing({ clock, materials, quality }: PartProps) {
  const group = useRef<Group>(null);
  const vents = useRef<InstancedMesh>(null);

  const geometry = useDisposable(() => {
    const ring = createSegmentedRing(SEGMENT_PROFILE, SEGMENT_LAYOUT, 0.05, quality.radialSegments);
    return {
      polished: ring.geometries[0],
      dark: ring.geometries[1],
      lamp: new BoxGeometry(0.15, 0.026, 0.01),
      vent: new BoxGeometry(0.1, 0.012, 0.008),
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

/** Turbine-like ribbed ring: pitched blades held between two machined races. */
export function FinRing({ clock, materials, quality }: PartProps) {
  const group = useRef<Group>(null);
  const fins = useRef<InstancedMesh>(null);
  const count = quality.finCount;

  const geometry = useDisposable(
    () => ({
      innerRace: createMachinedRing(FIN_INNER_RACE, quality.radialSegments),
      outerRace: createMachinedRing(FIN_OUTER_RACE, quality.radialSegments),
      fin: new BoxGeometry(FIN.length, FIN.thickness, FIN.depth),
    }),
    [quality.radialSegments],
  );

  useLayoutEffect(() => {
    const mesh = fins.current;
    if (!mesh) return;
    layoutInstances(mesh, count, (index, target) => {
      const angle = (index / count) * TAU;
      target.position.set(Math.cos(angle) * FIN.radius, Math.sin(angle) * FIN.radius, 0);
      target.rotation.z = angle;
      target.rotateX(FIN.pitch);
    });
  }, [geometry, count]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const intro = easeOutCubic(segment(clock.intro, 0.1, 0.62));
    const explode = clock.journey.explode;
    g.position.z = lerp(-1.4, 0, intro) - 1.3 * explode;
    g.rotation.z = -clock.time * 0.055 - (1 - intro) * 0.8;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry.innerRace} material={materials.chrome} />
      <mesh geometry={geometry.outerRace} material={materials.steel} />
      <instancedMesh ref={fins} args={[geometry.fin, materials.gunmetal, count]} />
      <Conduits clock={clock} materials={materials} quality={quality} />
    </group>
  );
}
