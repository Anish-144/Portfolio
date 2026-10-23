import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3, type Group } from 'three';
import { easeOutCubic, lerp, segment, smoothstep } from '../../animation/easing';
import type { MotionState } from '../../animation/motion';
import type { PartKey } from './journey';
import { createSculptureMaterials } from './materials';
import { Core } from './parts/Core';
import { ArrivalPulse, DataBus, DataStream } from './parts/Details';
import { DialGimbal, GearGimbal, ScannerOrbit } from './parts/Gimbals';
import { Bearing, Collar, FinRing, SegmentRing } from './parts/InnerRings';
import { NetworkLattice } from './parts/NetworkLattice';
import type { QualitySettings } from './quality';
import type { SceneClock } from './sceneClock';

/** Resting three-quarter pose: enough angle to read every layer's depth. */
const POSE: [number, number, number] = [0.28, -0.5, 0.05];

/** Radians of rotation per CSS pixel of drag. */
const DRAG_SPEED = 0.0085;
/** How quickly a flick's momentum fades (higher = shorter glide). */
const INERTIA_DECAY = 3.2;
/** After this long without input the sculpture eases back to its composed pose. */
const RETURN_AFTER_MS = 5000;
const RETURN_RATE = 1.4;

const UP = new Vector3(0, 1, 0);
const IDENTITY = new Quaternion();

/**
 * How far back along the assembly axis each component travels as it leaves
 * the stage in the teardown. It shrinks to nothing on the way, so it never
 * pops out while still in frame; arriving parts grow back out of the depth.
 */
const EXIT_DEPTH: Record<PartKey, number> = {
  core: -4,
  segments: -6,
  turbine: -8,
  bus: -7,
  gear: -10,
  dial: -12,
  scanner: -12,
  network: -10,
};

/**
 * How far each component turns about the assembly axis on its way in or out,
 * so a hand-off reads as parts screwing in and unwinding. Neighbors alternate.
 */
const TWIST: Record<PartKey, number> = {
  core: 0.9,
  segments: -1.3,
  turbine: 1.6,
  bus: -1.1,
  gear: 1.2,
  dial: -1.5,
  scanner: 0.8,
  network: 0.4,
};

/** Moves one component on or off stage from the journey's presence value. */
function PartSlot({ clock, part, children }: { clock: SceneClock; part: PartKey; children: ReactNode }) {
  const slot = useRef<Group>(null);

  useFrame(() => {
    const g = slot.current;
    if (!g) return;
    // Staggered hand-off: departing parts clear out in the first half of a
    // transition, arriving parts come in during the second half.
    const presence = smoothstep(0.45, 1, clock.journey.parts[part]);
    g.visible = presence > 0.01;
    if (!g.visible) return;
    g.position.z = (1 - presence) * EXIT_DEPTH[part];
    g.rotation.z = (1 - presence) ** 2 * TWIST[part];
    g.scale.setScalar(presence);
  });

  return <group ref={slot}>{children}</group>;
}

interface SculptureProps {
  clock: SceneClock;
  quality: QualitySettings;
  motion: MotionState;
}

/**
 * The procedural centerpiece, outermost to innermost:
 * network lattice → scanner orbit → dial gimbal → gear gimbal (pinions, pivots,
 * engraving) → data bus → turbine (rotor, stator, coolant loops) → indexing
 * ring → ball bearing → ribbed collar (with iris) → split core (pole crowns,
 * inner gyro). A particle data stream and arrival pulses run through the ring plane.
 *
 * The outermost group carries the visitor's own rotation: a free 360° turn
 * around camera-relative axes, with momentum, that eases home when left alone.
 */
export function Sculpture({ clock, quality, motion }: SculptureProps) {
  const user = useRef<Group>(null);
  const root = useRef<Group>(null);
  const velocity = useRef({ yaw: 0, pitch: 0 });
  const scratch = useMemo(() => ({ right: new Vector3(), yaw: new Quaternion(), pitch: new Quaternion() }), []);
  const materials = useMemo(() => createSculptureMaterials(quality.tier), [quality.tier]);

  useEffect(() => () => materials.dispose(), [materials]);

  useFrame(({ camera }, delta) => {
    materials.setPower(clock.power);
    const dt = Math.min(delta, 1 / 30);

    // Visitor rotation.
    const turnable = user.current;
    if (turnable) {
      const input = motion.rotate;
      const v = velocity.current;
      let yaw = 0;
      let pitch = 0;

      if (input.dx !== 0 || input.dy !== 0) {
        yaw = input.dx * DRAG_SPEED;
        pitch = input.yawOnly ? 0 : input.dy * DRAG_SPEED;
        input.dx = 0;
        input.dy = 0;
        if (dt > 0) {
          v.yaw = yaw / dt;
          v.pitch = pitch / dt;
        }
      } else if (input.dragging) {
        // Holding still: a release from here shouldn't fling.
        v.yaw = 0;
        v.pitch = 0;
      } else if (!clock.still) {
        yaw = v.yaw * dt;
        pitch = v.pitch * dt;
        const decay = Math.exp(-INERTIA_DECAY * dt);
        v.yaw *= decay;
        v.pitch *= decay;
      }

      if (yaw !== 0 || pitch !== 0) {
        scratch.right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
        scratch.yaw.setFromAxisAngle(UP, yaw);
        scratch.pitch.setFromAxisAngle(scratch.right, pitch);
        turnable.quaternion.premultiply(scratch.yaw).premultiply(scratch.pitch).normalize();
      }

      const idle = performance.now() - input.lastActive;
      if (!input.dragging && !clock.still && idle > RETURN_AFTER_MS && Math.abs(v.yaw) + Math.abs(v.pitch) < 0.05) {
        turnable.quaternion.slerp(IDENTITY, 1 - Math.exp(-RETURN_RATE * dt));
      }
    }

    const g = root.current;
    if (!g) return;
    const intro = easeOutCubic(segment(clock.intro, 0, 0.9));
    const { tilt, turn } = clock.journey;
    g.scale.setScalar(lerp(0.84, 1, intro));
    g.rotation.x = -clock.pointerY * 0.09 + tilt;
    g.rotation.y = lerp(-1.0, 0, intro) + clock.pointerX * 0.14 + turn;
  });

  const parts = { clock, materials, quality };

  return (
    <group ref={user}>
      <group ref={root}>
        <group rotation={POSE}>
          <PartSlot clock={clock} part="core">
            <Core {...parts} />
            <Collar {...parts} />
          </PartSlot>
          <PartSlot clock={clock} part="segments">
            <Bearing {...parts} />
            <SegmentRing {...parts} />
          </PartSlot>
          <PartSlot clock={clock} part="turbine">
            <FinRing {...parts} />
          </PartSlot>
          <PartSlot clock={clock} part="bus">
            <DataBus {...parts} />
          </PartSlot>
          <PartSlot clock={clock} part="gear">
            <GearGimbal {...parts} />
          </PartSlot>
          <PartSlot clock={clock} part="dial">
            <DialGimbal {...parts} />
          </PartSlot>
          <PartSlot clock={clock} part="scanner">
            <ScannerOrbit {...parts} />
          </PartSlot>
          <DataStream {...parts} />
          <ArrivalPulse {...parts} />
        </group>
        <PartSlot clock={clock} part="network">
          <NetworkLattice {...parts} />
        </PartSlot>
      </group>
    </group>
  );
}
