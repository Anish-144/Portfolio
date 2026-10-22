import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BoxGeometry,
  CylinderGeometry,
  TorusGeometry,
  type Group,
  type InstancedMesh,
  type Object3D,
} from 'three';
import { TAU, easeInOutCubic, lerp, segment } from '../../../animation/easing';
import { createMachinedRing } from '../geometry';
import { useDisposable } from '../useDisposable';
import { layoutInstances, type PartProps } from './shared';

/* -------------------------------------------------------------- Gear ring */

const GEAR = { inner: 2.5, outer: 2.7, depth: 0.1, chamfer: 0.018 } as const;
const GEAR_BOLTS = 8;
const GEAR_FACE_RADIUS = (GEAR.inner + GEAR.outer) / 2;
const GEAR_STATUS_ANGLE = 0.62;

/**
 * Toothed outer ring on a two-axis gimbal. It starts coplanar with the inner
 * rings and swings open during the entrance, like an armillary unfolding.
 */
export function GearGimbal({ clock, materials, quality }: PartProps) {
  const precession = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const teeth = useRef<InstancedMesh>(null);
  const bolts = useRef<InstancedMesh>(null);
  const toothCount = quality.toothCount;

  const geometry = useDisposable(
    () => ({
      ring: createMachinedRing(GEAR, quality.radialSegments),
      tooth: new BoxGeometry(0.06, 0.05, 0.07),
      bolt: new CylinderGeometry(0.03, 0.03, 0.026, 6).rotateX(Math.PI / 2),
      status: new BoxGeometry(0.2, 0.026, 0.012),
    }),
    [quality.radialSegments],
  );

  useLayoutEffect(() => {
    const toothMesh = teeth.current;
    const boltMesh = bolts.current;
    if (!toothMesh || !boltMesh) return;
    layoutInstances(toothMesh, toothCount, (index, target) => {
      const angle = (index / toothCount) * TAU;
      target.position.set(Math.cos(angle) * (GEAR.outer + 0.028), Math.sin(angle) * (GEAR.outer + 0.028), 0);
      target.rotation.z = angle;
    });
    layoutInstances(boltMesh, GEAR_BOLTS, (index, target) => {
      const angle = (index / GEAR_BOLTS) * TAU + 0.2;
      target.position.set(
        Math.cos(angle) * GEAR_FACE_RADIUS,
        Math.sin(angle) * GEAR_FACE_RADIUS,
        GEAR.depth / 2 + 0.012,
      );
    });
  }, [geometry, toothCount]);

  useFrame(() => {
    const open = easeInOutCubic(segment(clock.intro, 0.22, 0.62));
    const explode = clock.journey.explode;
    // Bounded sway rather than full precession: the ring never turns edge-on to the camera.
    if (precession.current) precession.current.rotation.y = 0.3 + Math.sin(clock.time * 0.11) * 0.3;
    if (tilt.current) tilt.current.rotation.x = lerp(0, 0.78, open) + 0.3 * explode;
    if (spin.current) spin.current.rotation.z = clock.time * 0.03;
  });

  return (
    <group ref={precession}>
      <group ref={tilt}>
        <group ref={spin}>
          <mesh geometry={geometry.ring} material={materials.steel} />
          <instancedMesh ref={teeth} args={[geometry.tooth, materials.chrome, toothCount]} />
          <instancedMesh ref={bolts} args={[geometry.bolt, materials.chrome, GEAR_BOLTS]} />
          <mesh
            geometry={geometry.status}
            material={materials.amber}
            position={[
              Math.cos(GEAR_STATUS_ANGLE) * GEAR_FACE_RADIUS,
              Math.sin(GEAR_STATUS_ANGLE) * GEAR_FACE_RADIUS,
              GEAR.depth / 2 + 0.006,
            ]}
            rotation-z={GEAR_STATUS_ANGLE + Math.PI / 2}
          />
        </group>
      </group>
    </group>
  );
}

/* -------------------------------------------------------------- Dial ring */

const DIAL = { inner: 3.0, outer: 3.05, depth: 0.028, chamfer: 0.006 } as const;
const DIAL_SECTORS = 12;
const AMBER_MAJORS = [0, 5, 8];

/** Hairline instrument ring with graduated ticks; a few majors are lit amber. */
export function DialGimbal({ clock, materials, quality }: PartProps) {
  const tilt = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const ticks = useRef<InstancedMesh>(null);
  const litTicks = useRef<InstancedMesh>(null);
  const tickCount = quality.tickCount;
  const perSector = Math.max(1, Math.round(tickCount / DIAL_SECTORS));

  const geometry = useDisposable(
    () => ({
      ring: createMachinedRing(DIAL, quality.radialSegments),
      tick: new BoxGeometry(1, 1, 1),
    }),
    [quality.radialSegments],
  );

  useLayoutEffect(() => {
    const tickMesh = ticks.current;
    const litMesh = litTicks.current;
    if (!tickMesh || !litMesh) return;

    const placeTick = (index: number, major: boolean, target: Object3D) => {
      const angle = (index / tickCount) * TAU;
      const length = major ? 0.13 : 0.055;
      const radius = DIAL.inner - length / 2 - 0.006;
      target.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      target.rotation.z = angle;
      target.scale.set(length, major ? 0.012 : 0.007, 0.012);
    };

    layoutInstances(tickMesh, tickCount, (index, target) => placeTick(index, index % perSector === 0, target));
    layoutInstances(litMesh, AMBER_MAJORS.length, (index, target) =>
      placeTick((AMBER_MAJORS[index] ?? 0) * perSector, true, target),
    );
  }, [geometry, tickCount, perSector]);

  useFrame(() => {
    const open = easeInOutCubic(segment(clock.intro, 0.3, 0.62));
    const explode = clock.journey.explode;
    if (tilt.current) {
      // Tilted against the sculpture's resting pose so the dial reads as an open ellipse.
      tilt.current.rotation.x = lerp(0, -0.45, open);
      tilt.current.rotation.y = lerp(0, 0.95, open) + Math.sin(clock.time * 0.08 + 1.3) * 0.16 - 0.3 * explode;
    }
    if (spin.current) spin.current.rotation.z = -clock.time * 0.035;
  });

  return (
    <group ref={tilt}>
      <group ref={spin}>
        <mesh geometry={geometry.ring} material={materials.chrome} />
        <instancedMesh ref={ticks} args={[geometry.tick, materials.steel, tickCount]} />
        <instancedMesh ref={litTicks} args={[geometry.tick, materials.amber, AMBER_MAJORS.length]} />
      </group>
    </group>
  );
}

/* ---------------------------------------------------------- Scanner orbit */

const ORBIT_RADIUS = 3.4;

/** A hairline orbit with a short amber arc sweeping along it, like a scan pass. */
export function ScannerOrbit({ clock, materials, quality }: PartProps) {
  const sweep = useRef<Group>(null);

  const geometry = useDisposable(
    () => ({
      track: new TorusGeometry(ORBIT_RADIUS, 0.0032, 6, quality.radialSegments * 2),
      scanner: new TorusGeometry(ORBIT_RADIUS, 0.011, 8, 48, 0.34),
    }),
    [quality.radialSegments],
  );

  useFrame(() => {
    if (sweep.current) sweep.current.rotation.z = clock.time * 0.19;
  });

  return (
    <group rotation={[1.2, 0.42, 0]}>
      <mesh geometry={geometry.track} material={materials.steel} />
      <group ref={sweep}>
        <mesh geometry={geometry.scanner} material={materials.amber} />
      </group>
    </group>
  );
}
