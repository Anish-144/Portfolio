import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { damp, easeInOutSine, segment, smoothstep } from '../../animation/easing';
import { markSceneReady, type MotionState } from '../../animation/motion';
import { sampleJourney, stationsFor } from './journey';
import type { SceneClock } from './sceneClock';

/** Longest step the animation may take in one frame (tab switches, hitches). */
const MAX_STEP = 1 / 30;
/** Moment in the mechanical cycle shown as the still pose under reduced motion. */
const STILL_POSE_TIME = 7.5;
/** How quickly the journey catches up with the scroll position (higher = tighter). */
const TRAVEL_DAMPING = 4.5;
/** Arrival surge envelope: fast attack, slow decay (per second). */
const SURGE_ATTACK = 14;
const SURGE_DECAY = 1.6;

interface ClockDriverProps {
  clock: SceneClock;
  motion: MotionState;
  reduced: boolean;
}

/** Samples DOM-driven motion into the scene clock. Runs before every other frame callback. */
export function ClockDriver({ clock, motion, reduced }: ClockDriverProps) {
  const frames = useRef(0);
  const opacity = useRef(-1);
  const station = useRef(-1);
  const canvas = useThree((state) => state.gl.domElement);

  useFrame(({ size }, delta) => {
    const dt = Math.min(delta, MAX_STEP);
    const scrollY = window.scrollY;
    clock.still = reduced;

    if (reduced) {
      clock.time = STILL_POSE_TIME;
      clock.intro = 1;
      clock.travel = scrollY;
      clock.pointerX = 0;
      clock.pointerY = 0;
    } else {
      clock.intro = motion.intro;
      // Smoothed travel gives every station change a little inertia.
      clock.travel = Number.isNaN(clock.travel) ? scrollY : damp(clock.travel, scrollY, TRAVEL_DAMPING, dt);
      const hover = motion.rotate.dragging ? 0 : 1;
      clock.pointerX = damp(clock.pointerX, motion.pointer.x * hover, 2.4, dt);
      clock.pointerY = damp(clock.pointerY, motion.pointer.y * hover, 2.4, dt);
    }

    clock.journey = sampleJourney(
      stationsFor(size.width, size.height),
      motion.sections,
      clock.travel,
      { width: size.width, height: size.height, scrollY, hero: motion.stage, contact: motion.finaleStage },
      reduced,
    );
    if (!reduced) clock.time += dt * clock.journey.tempo;

    // Each new station sends a surge through the lit parts (not on load, not under reduced motion).
    const arrived = station.current !== -1 && station.current !== clock.journey.station;
    station.current = clock.journey.station;
    clock.sinceArrival = arrived && !reduced ? 0 : clock.sinceArrival + dt;
    const since = clock.sinceArrival;
    clock.surge = Number.isFinite(since) ? (1 - Math.exp(-SURGE_ATTACK * since)) * Math.exp(-SURGE_DECAY * since) : 0;

    // Light arrives while the camera is still orbiting, so reflections sweep across the metal.
    clock.lights = easeInOutSine(segment(clock.intro, 0, 0.5));
    clock.power = smoothstep(0.5, 0.95, clock.intro);

    // Content sections keep the sculpture in the background.
    if (Math.abs(opacity.current - clock.journey.opacity) > 0.004) {
      opacity.current = clock.journey.opacity;
      canvas.style.opacity = clock.journey.opacity.toFixed(3);
    }

    // Wait for a couple of frames so shader compilation doesn't eat the entrance.
    frames.current += 1;
    if (frames.current === (reduced ? 1 : 3)) markSceneReady(motion);
  }, -1);

  return null;
}
