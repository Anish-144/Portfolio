import { restingFrame, type JourneyFrame } from './journey';

/**
 * Per-frame values shared by every part of the scene. Written once per frame by
 * <ClockDriver> (which runs first), then read by lights, camera and sculpture.
 */
export interface SceneClock {
  /** Animated seconds. Frozen under reduced motion, clamped across tab switches. */
  time: number;
  /** Linear 0 → 1 entrance progress. */
  intro: number;
  /** 0 → 1 key light and environment ramp. */
  lights: number;
  /** 0 → 1 amber emissive power-on, last in the sequence. */
  power: number;
  /** Smoothed scroll offset (px) that drives the journey between stations. */
  travel: number;
  /** Where and how the sculpture is presented this frame. */
  journey: JourneyFrame;
  pointerX: number;
  pointerY: number;
  /** True under reduced motion: event animations (arrival pulses) stay off. */
  still: boolean;
}

export const createSceneClock = (): SceneClock => ({
  time: 0,
  intro: 0,
  lights: 0,
  power: 0,
  travel: Number.NaN,
  journey: restingFrame(),
  pointerX: 0,
  pointerY: 0,
  still: false,
});
