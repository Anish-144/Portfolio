import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  MeshBasicMaterial,
  RepeatWrapping,
  TorusGeometry,
  type Group,
  type InstancedMesh,
  type Object3D,
} from 'three';
import { TAU, easeInOutCubic, lerp, segment } from '../../../animation/easing';
import { createAnnulusStrip, createMachinedRing, createSpurGear } from '../geometry';
import { useDisposable } from '../useDisposable';
import { layoutInstances, type PartProps } from './shared';

/* -------------------------------------------------------------- Gear ring */

const GEAR = { inner: 2.5, outer: 2.7, depth: 0.1, chamfer: 0.018 } as const;
const GEAR_TOOTH_RADIUS = GEAR.outer + 0.028;
const GEAR_BOLTS = 8;
/** Bolts and the status lamp ride the outer band; the inscription runs inside them. */
const GEAR_RIM_RADIUS = 2.668;
const GEAR_STATUS_ANGLE = 0.62;
const INSCRIPTION_BAND = { inner: 2.512, outer: 2.632 } as const;
const INSCRIPTION = 'ANISH PATEL  ·  SYSTEM CORE MK II  ·  AGENTIC AI  ·  RAG  ·  SECURITY ENGINEERING  ·  ';

/** Pinions mesh with the gear's teeth and turn at the true ratio. */
const PINION = { pitch: 0.105, teeth: 11, width: 0.05 } as const;
const PINION_RADIUS = GEAR_TOOTH_RADIUS + 0.03 + PINION.pitch + 0.013;
const PINION_ANGLES = [Math.PI / 2, Math.PI / 2 + TAU / 3, Math.PI / 2 + (2 * TAU) / 3];
const PINION_RATIO = GEAR_TOOTH_RADIUS / PINION.pitch;
/** Gimbal pivots sit on the tilt axis (local ±X). */
const PIVOT_X = 2.95;

/**
 * Micro-engraved text wrapped once around the gear face. The canvas is drawn
 * at roughly the band's aspect so letters keep their proportions, and the
 * phrase is scaled to repeat a whole number of times, so the join is seamless.
 */
function createInscriptionTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '600 21px "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace';
    context.textBaseline = 'middle';
    context.letterSpacing = '3px';
    const unit = context.measureText(INSCRIPTION).width;
    const repeats = Math.max(1, Math.round(canvas.width / unit));
    context.setTransform(canvas.width / (unit * repeats), 0, 0, 1, 0, 0);
    context.fillStyle = '#fff';
    for (let index = 0; index < repeats; index++) context.fillText(INSCRIPTION, index * unit, canvas.height / 2 + 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Toothed outer ring on a two-axis gimbal. It starts coplanar with the inner
 * rings and swings open during the entrance, like an armillary unfolding.
 * Pivot bearings carry it on the tilt axis; three pinions mesh with its teeth;
 * an inscription is engraved around its face.
 */
export function GearGimbal({ clock, materials, quality }: PartProps) {
  const precession = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const teeth = useRef<InstancedMesh>(null);
  const bolts = useRef<InstancedMesh>(null);
  const pinions = useRef<InstancedMesh>(null);
  const brackets = useRef<InstancedMesh>(null);
  const housings = useRef<InstancedMesh>(null);
  const axles = useRef<InstancedMesh>(null);
  const toothCount = quality.toothCount;

  const geometry = useDisposable(() => {
    const inscription = createInscriptionTexture();
    return {
      ring: createMachinedRing(GEAR, quality.radialSegments),
      tooth: new BoxGeometry(0.06, 0.05, 0.07),
      bolt: new CylinderGeometry(0.024, 0.024, 0.024, 6).rotateX(Math.PI / 2),
      status: new BoxGeometry(0.2, 0.024, 0.012),
      pinion: createSpurGear(PINION.pitch, PINION.teeth, PINION.width),
      bracket: new BoxGeometry(0.17, 0.05, 0.022),
      housing: new CylinderGeometry(0.075, 0.075, 0.13, 24).rotateZ(Math.PI / 2),
      axle: new CylinderGeometry(0.028, 0.028, 0.4, 12).rotateZ(Math.PI / 2),
      band: createAnnulusStrip(INSCRIPTION_BAND.inner, INSCRIPTION_BAND.outer, quality.radialSegments * 2),
      inscription,
      engraving: new MeshBasicMaterial({
        color: '#d6dae0',
        alphaMap: inscription,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    };
  }, [quality.radialSegments]);

  useLayoutEffect(() => {
    const toothMesh = teeth.current;
    const boltMesh = bolts.current;
    const bracketMesh = brackets.current;
    const housingMesh = housings.current;
    const axleMesh = axles.current;
    if (!toothMesh || !boltMesh || !bracketMesh || !housingMesh || !axleMesh) return;
    layoutInstances(toothMesh, toothCount, (index, target) => {
      const angle = (index / toothCount) * TAU;
      target.position.set(Math.cos(angle) * GEAR_TOOTH_RADIUS, Math.sin(angle) * GEAR_TOOTH_RADIUS, 0);
      target.rotation.z = angle;
    });
    layoutInstances(boltMesh, GEAR_BOLTS, (index, target) => {
      const angle = (index / GEAR_BOLTS) * TAU + 0.2;
      target.position.set(
        Math.cos(angle) * GEAR_RIM_RADIUS,
        Math.sin(angle) * GEAR_RIM_RADIUS,
        GEAR.depth / 2 + 0.012,
      );
    });
    // A short arm behind each pinion, reaching out to the gimbal frame.
    layoutInstances(bracketMesh, PINION_ANGLES.length, (index, target) => {
      const angle = PINION_ANGLES[index] ?? 0;
      const radius = PINION_RADIUS + 0.06;
      target.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -0.06);
      target.rotation.z = angle;
    });
    layoutInstances(housingMesh, 2, (index, target) => {
      target.position.set(index === 0 ? PIVOT_X : -PIVOT_X, 0, 0);
    });
    layoutInstances(axleMesh, 2, (index, target) => {
      target.position.set(index === 0 ? PIVOT_X - 0.13 : -(PIVOT_X - 0.13), 0, 0);
    });
  }, [geometry, toothCount]);

  useFrame(() => {
    const open = easeInOutCubic(segment(clock.intro, 0.22, 0.62));
    const explode = clock.journey.explode;
    const spinAngle = clock.time * 0.03;
    // Bounded sway rather than full precession: the ring never turns edge-on to the camera.
    if (precession.current) precession.current.rotation.y = 0.3 + Math.sin(clock.time * 0.11) * 0.3;
    if (tilt.current) tilt.current.rotation.x = lerp(0, 0.78, open) + 0.3 * explode;
    if (spin.current) spin.current.rotation.z = spinAngle;
    geometry.engraving.opacity = 0.62 * clock.lights * clock.journey.level;

    // Meshing pinions turn the opposite way, at the gear ratio.
    const pinionMesh = pinions.current;
    if (!pinionMesh) return;
    layoutInstances(pinionMesh, PINION_ANGLES.length, (index, target) => {
      const angle = PINION_ANGLES[index] ?? 0;
      target.position.set(Math.cos(angle) * PINION_RADIUS, Math.sin(angle) * PINION_RADIUS, 0);
      target.rotation.z = -spinAngle * PINION_RATIO + index * 0.4;
    });
  });

  return (
    <group ref={precession}>
      <instancedMesh ref={housings} args={[geometry.housing, materials.steel, 2]} />
      <instancedMesh ref={axles} args={[geometry.axle, materials.chrome, 2]} />
      <group ref={tilt}>
        <instancedMesh ref={pinions} args={[geometry.pinion, materials.chrome, PINION_ANGLES.length]} />
        <instancedMesh ref={brackets} args={[geometry.bracket, materials.gunmetal, PINION_ANGLES.length]} />
        <group ref={spin}>
          <mesh geometry={geometry.ring} material={materials.steel} />
          <instancedMesh ref={teeth} args={[geometry.tooth, materials.chrome, toothCount]} />
          <instancedMesh ref={bolts} args={[geometry.bolt, materials.chrome, GEAR_BOLTS]} />
          <mesh geometry={geometry.band} material={geometry.engraving} position-z={GEAR.depth / 2 + 0.0015} />
          <mesh
            geometry={geometry.status}
            material={materials.amber}
            position={[
              Math.cos(GEAR_STATUS_ANGLE) * GEAR_RIM_RADIUS,
              Math.sin(GEAR_STATUS_ANGLE) * GEAR_RIM_RADIUS,
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

const DIAL = { inner: 3.18, outer: 3.22, depth: 0.028, chamfer: 0.006 } as const;
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
