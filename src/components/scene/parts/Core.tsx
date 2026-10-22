import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
  type Group,
  type InstancedMesh,
  type PointLight,
} from 'three';
import { TAU } from '../../../animation/easing';
import { createShellCap } from '../geometry';
import { AMBER, type SculptureMaterials } from '../materials';
import { useDisposable } from '../useDisposable';
import { layoutInstances, type PartProps } from './shared';

const SHELL = { outer: 0.74, inner: 0.69, gap: 0.1 } as const;
const RIM_HEIGHT = SHELL.outer * Math.sin(SHELL.gap);
const BOLT_COUNT = 12;
/** Polar angle (from +Y) of the bolt circle, just above the slit. */
const BOLT_POLAR = Math.PI / 2 - SHELL.gap - 0.12;
const UP = new Vector3(0, 1, 0);

interface CapGeometry {
  shell: BufferGeometry;
  lip: BufferGeometry;
  bolt: BufferGeometry;
}

/** One blackened hemisphere with a chrome lip and a ring of hex bolts. */
function CoreCap({ geometry, materials }: { geometry: CapGeometry; materials: SculptureMaterials }) {
  const bolts = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = bolts.current;
    if (!mesh) return;
    const normal = new Vector3();
    layoutInstances(mesh, BOLT_COUNT, (index, target) => {
      const phi = (index / BOLT_COUNT) * TAU;
      normal.set(Math.sin(BOLT_POLAR) * Math.cos(phi), Math.cos(BOLT_POLAR), Math.sin(BOLT_POLAR) * Math.sin(phi));
      target.position.copy(normal).multiplyScalar(SHELL.outer + 0.004);
      target.quaternion.setFromUnitVectors(UP, normal);
    });
  }, [geometry]);

  return (
    <>
      <mesh geometry={geometry.shell} material={materials.blackened} />
      <mesh geometry={geometry.lip} material={materials.chrome} position-y={RIM_HEIGHT} />
      <instancedMesh ref={bolts} args={[geometry.bolt, materials.chrome, BOLT_COUNT]} />
    </>
  );
}

/**
 * The dark heart of the sculpture: a clear-coated black sphere inside a split
 * shell. An amber filament glows through the equatorial slit, and the two
 * halves part as the hero scrolls away.
 */
export function Core({ clock, materials, quality }: PartProps) {
  const spin = useRef<Group>(null);
  const top = useRef<Group>(null);
  const bottom = useRef<Group>(null);
  const light = useRef<PointLight>(null);

  const geometry = useDisposable(
    () => ({
      shell: createShellCap(SHELL, quality.radialSegments),
      lip: new TorusGeometry(SHELL.outer * Math.cos(SHELL.gap), 0.0085, 10, quality.radialSegments).rotateX(
        Math.PI / 2,
      ),
      bolt: new CylinderGeometry(0.021, 0.021, 0.02, 6),
      sphere: new SphereGeometry(0.6, 64, 48),
      filament: new TorusGeometry(0.645, 0.016, 12, quality.radialSegments).rotateX(Math.PI / 2),
    }),
    [quality.radialSegments],
  );

  useFrame(() => {
    const open = clock.journey.explode * 0.3;
    if (spin.current) spin.current.rotation.y = clock.time * 0.14;
    if (top.current) top.current.position.y = open;
    if (bottom.current) bottom.current.position.y = -open;
    if (light.current) light.current.intensity = 6 * clock.power;
  });

  const cap = { geometry, materials };

  return (
    <group>
      <mesh geometry={geometry.sphere} material={materials.obsidian} />
      <mesh geometry={geometry.filament} material={materials.amber} />
      <pointLight ref={light} color={AMBER} intensity={0} distance={3.6} decay={2} />
      <group ref={spin}>
        <group ref={top}>
          <CoreCap {...cap} />
        </group>
        <group ref={bottom}>
          <group rotation-x={Math.PI}>
            <CoreCap {...cap} />
          </group>
        </group>
      </group>
    </group>
  );
}
