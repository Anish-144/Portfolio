import { clamp01, easeInOutCubic, lerp, smoothstep } from '../../animation/easing';
import type { SectionPosition, StageMetrics } from '../../animation/motion';
import type { SectionId } from '../../config/site';

/**
 * The sculpture travels with the reader as a teardown. Each section has a
 * station: which components are on stage, where they sit, how they are seen
 * and framed. While a section enters the viewport the scene blends from the
 * previous station to this one: components leave along the assembly axis or
 * expand away, the camera reframes on what remains, and a dimension ring
 * marks it once the section has arrived.
 */

/** Components that can be isolated, innermost to outermost. */
export const PART_KEYS = ['core', 'segments', 'turbine', 'bus', 'gear', 'dial', 'scanner', 'network'] as const;
export type PartKey = (typeof PART_KEYS)[number];
export type PartPresence = Record<PartKey, number>;

/** Where the framing circle sits. Viewport anchors are fractions of the viewport. */
export type Anchor =
  | { kind: 'hero' }
  | { kind: 'contact' }
  | { kind: 'viewport'; x: number; y: number; size: number };

export interface Pose {
  /** 0 assembled → 1 fully exploded technical view. */
  explode: number;
  /** Camera orbit offsets (radians). */
  yaw: number;
  pitch: number;
  /** Sculpture rotation offsets (radians). */
  tilt: number;
  turn: number;
  /** Lighting level, 0–1. */
  level: number;
  /** Canvas opacity, 0–1: content sections keep it in the background. */
  opacity: number;
  /** Speed multiplier for the mechanical motion. */
  tempo: number;
  /** Iris over the core: 1 open, 0 closed to a pupil. */
  aperture: number;
  /** Density of the data stream spiralling into the core, 0–1. */
  flow: number;
  /** Activity of the data-bus ring's travelling packets, 0–1. */
  bus: number;
  /** World radius framed by the anchor's circle (smaller = zoomed in). */
  fit: number;
  /** World radius of the featured component (the dimension ring hugs it). */
  focus: number;
}

export interface Station {
  id: SectionId;
  anchor: Anchor;
  pose: Pose;
  /** Components on stage (1) or away (0); unspecified parts are away. */
  parts: PartPresence;
  /** Shows the dimension ring once the section has arrived. */
  callout?: boolean;
}

export interface JourneyFrame extends Pose {
  /** Framing center and diameter in viewport pixels. */
  x: number;
  y: number;
  size: number;
  parts: PartPresence;
  /** Index and id of the station the frame is (mostly) at. */
  station: number;
  stationId: SectionId;
  /** How visible the arriving station's callout is (0–1). */
  calloutOpacity: number;
}

const WHOLE = 3.55;

const pose = (values: Partial<Pose>): Pose => ({
  explode: 0,
  yaw: 0,
  pitch: 0,
  tilt: 0,
  turn: 0,
  level: 1,
  opacity: 1,
  tempo: 1,
  aperture: 1,
  flow: 0,
  bus: 0.5,
  fit: WHOLE,
  focus: WHOLE,
  ...values,
});

const only = (...keys: PartKey[]): PartPresence =>
  Object.fromEntries(PART_KEYS.map((key) => [key, keys.includes(key) ? 1 : 0])) as PartPresence;

const ALL = only(...PART_KEYS);

/* Wide layouts: each section isolates one component in the free space beside its heading. */
const WIDE: readonly Station[] = [
  { id: 'top', anchor: { kind: 'hero' }, pose: pose({ flow: 0.2 }), parts: ALL },
  {
    // Part 01: the core unit alone, shell parted, upper right beside the title.
    id: 'about',
    anchor: { kind: 'viewport', x: 0.8, y: 0.34, size: 0.56 },
    pose: pose({ explode: 0.45, yaw: 0.6, pitch: -0.05, tilt: 0.2, turn: 0.5, level: 0.75, opacity: 0.8, aperture: 0.7, flow: 0.45, bus: 0.6, tempo: 0.8, fit: 1.3, focus: 1.08 }),
    parts: only('core'),
    callout: true,
  },
  {
    // Part 02: the indexing ring, stepping like a timeline, upper left above the heading.
    id: 'experience',
    anchor: { kind: 'viewport', x: 0.2, y: 0.255, size: 0.39 },
    pose: pose({ yaw: -0.55, pitch: 0.2, tilt: -0.2, turn: -0.4, level: 0.7, opacity: 0.75, flow: 0.3, fit: 1.9, focus: 1.7 }),
    parts: only('segments'),
    callout: true,
  },
  {
    // Part 03: every component back, pulled apart into the full exploded view, top center.
    id: 'projects',
    anchor: { kind: 'viewport', x: 0.6, y: 0.31, size: 0.55 },
    pose: pose({ explode: 1, yaw: 1.45, pitch: 0.12, tilt: 0.55, turn: 0.15, level: 0.55, opacity: 0.55, flow: 1, bus: 0.8, tempo: 1.4, fit: 3.9, focus: 3.5 }),
    parts: ALL,
    callout: true,
  },
  {
    // Part 04: the turbine stage with its data bus, upper left above the heading.
    id: 'skills',
    anchor: { kind: 'viewport', x: 0.2, y: 0.265, size: 0.36 },
    pose: pose({ explode: 0.25, yaw: -0.55, pitch: -0.12, tilt: -0.15, turn: 0.35, level: 0.75, opacity: 0.8, flow: 0.4, bus: 1, tempo: 0.9, fit: 2.5, focus: 2.46 }),
    parts: only('turbine', 'bus'),
    callout: true,
  },
  {
    // Part 05: the instrument gimbals, large on the right (this section has no intro),
    // turned so the engraved gear face and pinions read.
    id: 'achievements',
    anchor: { kind: 'viewport', x: 0.73, y: 0.42, size: 0.62 },
    pose: pose({ explode: 0.1, yaw: 0.25, pitch: 0.12, tilt: -0.95, turn: -0.2, level: 0.75, opacity: 0.8, aperture: 0.06, flow: 0.35, bus: 0.9, fit: 3.32, focus: 3.24 }),
    parts: only('gear', 'dial'),
    callout: true,
  },
  { id: 'contact', anchor: { kind: 'contact' }, pose: pose({ yaw: 0.6, pitch: 0.12, flow: 0.35, bus: 0.6 }), parts: ALL },
];

/*
 * Narrow layouts: the same teardown, each part in the free band above its
 * section heading (alternating sides). Callouts are hidden in CSS.
 */
const COMPACT: readonly Station[] = [
  { id: 'top', anchor: { kind: 'hero' }, pose: pose({ flow: 0.2 }), parts: ALL },
  {
    id: 'about',
    anchor: { kind: 'viewport', x: 0.8, y: 0.2, size: 0.48 },
    pose: pose({ explode: 0.45, yaw: 0.6, tilt: 0.2, turn: 0.5, level: 0.7, opacity: 0.65, aperture: 0.7, flow: 0.45, tempo: 0.8, fit: 1.3, focus: 1.08 }),
    parts: only('core'),
  },
  {
    id: 'experience',
    anchor: { kind: 'viewport', x: 0.22, y: 0.2, size: 0.48 },
    pose: pose({ yaw: -0.55, pitch: 0.2, tilt: -0.2, turn: -0.4, level: 0.7, opacity: 0.65, flow: 0.3, fit: 1.9, focus: 1.7 }),
    parts: only('segments'),
  },
  {
    id: 'projects',
    anchor: { kind: 'viewport', x: 0.6, y: 0.2, size: 0.56 },
    pose: pose({ explode: 1, yaw: 1.45, tilt: 0.55, level: 0.55, opacity: 0.55, flow: 1, bus: 0.8, tempo: 1.4, fit: 3.9, focus: 3.5 }),
    parts: ALL,
  },
  {
    id: 'skills',
    anchor: { kind: 'viewport', x: 0.8, y: 0.2, size: 0.5 },
    pose: pose({ explode: 0.2, yaw: -1.0, pitch: -0.15, turn: 0.7, level: 0.7, opacity: 0.65, flow: 0.4, bus: 1, tempo: 0.9, fit: 2.5, focus: 2.46 }),
    parts: only('turbine', 'bus'),
  },
  {
    id: 'achievements',
    anchor: { kind: 'viewport', x: 0.22, y: 0.2, size: 0.52 },
    pose: pose({ explode: 0.1, yaw: 0.25, pitch: 0.12, tilt: -0.95, level: 0.7, opacity: 0.65, aperture: 0.06, flow: 0.35, bus: 0.9, fit: 3.32, focus: 3.24 }),
    parts: only('gear', 'dial'),
  },
  { id: 'contact', anchor: { kind: 'contact' }, pose: pose({ yaw: 0.6, pitch: 0.12, flow: 0.35, bus: 0.6 }), parts: ALL },
];

export const stationsFor = (width: number, height: number): readonly Station[] =>
  width < 900 || height > width * 1.1 ? COMPACT : WIDE;

/** A station is fully reached once its section's top is this far down the viewport. */
const ARRIVAL = 0.25;
/** Callouts fade out over this span of further scrolling (fractions of the viewport). */
const CALLOUT_HOLD = 0.3;
const CALLOUT_GONE = 0.75;

interface JourneyContext {
  width: number;
  height: number;
  /** Live scroll offset, so a scrolling stage (contact) is tracked exactly. */
  scrollY: number;
  hero: StageMetrics;
  contact: StageMetrics;
}

function resolve(anchor: Anchor, { width, height, scrollY, hero, contact }: JourneyContext) {
  switch (anchor.kind) {
    case 'hero':
      return { x: hero.x, y: hero.y, size: Math.min(hero.width, hero.height) };
    case 'contact':
      return { x: contact.x, y: contact.y - scrollY, size: Math.min(contact.width, contact.height) };
    default:
      return { x: anchor.x * width, y: anchor.y * height, size: anchor.size * Math.min(width, height) };
  }
}

const POSE_KEYS = Object.keys(pose({})) as Array<keyof Pose>;

/**
 * Blends between stations for a (smoothed) scroll position. With `snap`, the
 * frame jumps straight to the current station (reduced motion).
 */
export function sampleJourney(
  stations: readonly Station[],
  sections: readonly SectionPosition[],
  travel: number,
  context: JourneyContext,
  snap = false,
): JourneyFrame {
  let from = 0;
  let to = 0;
  let t = 1;
  let sinceArrival = Number.POSITIVE_INFINITY;

  for (let index = 1; index < stations.length; index++) {
    const station = stations[index];
    const top = station ? sections.find((section) => section.id === station.id)?.top : undefined;
    if (top === undefined) continue;
    const start = top - context.height;
    const end = top - context.height * ARRIVAL;
    if (travel < start) break;
    from = to;
    to = index;
    t = clamp01((travel - start) / (end - start));
    sinceArrival = travel - end;
  }

  let snappedBack = false;
  if (snap) {
    if (t < 0.5) {
      to = from;
      snappedBack = true;
    }
    t = 1;
  }

  const a = stations[from] ?? stations[0];
  const b = stations[to] ?? stations[0];
  if (!a || !b) throw new Error('Journey needs at least one station.');

  const w = easeInOutCubic(t);
  const pa = resolve(a.anchor, context);
  const pb = resolve(b.anchor, context);

  const blended = Object.fromEntries(POSE_KEYS.map((key) => [key, lerp(a.pose[key], b.pose[key], w)])) as unknown as Pose;
  const parts = Object.fromEntries(PART_KEYS.map((key) => [key, lerp(a.parts[key], b.parts[key], w)])) as PartPresence;

  const fade = 1 - smoothstep(context.height * CALLOUT_HOLD, context.height * CALLOUT_GONE, Math.max(0, sinceArrival));
  const calloutOpacity = b.callout && !snappedBack ? smoothstep(0.8, 1, t) * fade : 0;

  return {
    ...blended,
    x: lerp(pa.x, pb.x, w),
    y: lerp(pa.y, pb.y, w),
    size: lerp(pa.size, pb.size, w),
    parts,
    station: w < 0.5 ? from : to,
    stationId: (w < 0.5 ? a : b).id,
    calloutOpacity,
  };
}

export const restingFrame = (): JourneyFrame => ({
  ...pose({}),
  x: 0,
  y: 0,
  size: 600,
  parts: ALL,
  station: 0,
  stationId: 'top',
  calloutOpacity: 0,
});
