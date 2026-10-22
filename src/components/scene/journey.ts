import { clamp01, easeInOutCubic, lerp } from '../../animation/easing';
import type { SectionPosition, StageMetrics } from '../../animation/motion';
import type { SectionId } from '../../config/site';

/**
 * The sculpture travels with the reader. Each section has a station: where
 * the sculpture sits, how it is seen, and how much it is pulled apart. While a
 * section is entering the viewport the scene blends from the previous station
 * to this one, so every scroll between sections moves it differently.
 */

/** Where the sculpture is framed. Viewport anchors are fractions of the viewport. */
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
}

export interface Station {
  id: SectionId;
  anchor: Anchor;
  pose: Pose;
}

export interface JourneyFrame extends Pose {
  /** Framing center and diameter in viewport pixels. */
  x: number;
  y: number;
  size: number;
  /** Index of the station the frame is (mostly) at. */
  station: number;
}

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
  ...values,
});

/* Wide layouts: alternate sides, change scale and viewpoint, so every hand-off reads as a move. */
const WIDE: readonly Station[] = [
  { id: 'top', anchor: { kind: 'hero' }, pose: pose({}) },
  {
    // Lifts to the upper right, turning side-on above the statement.
    id: 'about',
    anchor: { kind: 'viewport', x: 0.86, y: 0.3, size: 0.8 },
    pose: pose({ aperture: 0.75, flow: 0.25, bus: 0.6, explode: 0.3, yaw: 0.85, pitch: -0.08, tilt: 0.25, turn: 0.35, level: 0.55, opacity: 0.42, tempo: 0.8 }),
  },
  {
    // Crosses to the left, kept inside the timeline's date column.
    id: 'experience',
    anchor: { kind: 'viewport', x: -0.02, y: 0.55, size: 0.78 },
    pose: pose({ aperture: 0.55, flow: 0.35, bus: 1, explode: 0.65, yaw: -0.7, pitch: 0.22, tilt: -0.25, turn: -0.45, level: 0.5, opacity: 0.4 }),
  },
  {
    // Recedes to the center as an exploded technical view, seen between the cards.
    id: 'projects',
    anchor: { kind: 'viewport', x: 0.52, y: 0.5, size: 0.62 },
    pose: pose({ aperture: 1, flow: 1, bus: 0.8, explode: 1, yaw: 1.45, pitch: 0.12, tilt: 0.55, turn: 0.15, level: 0.5, opacity: 0.42, tempo: 1.4 }),
  },
  {
    // Sinks to the lower right, mostly behind the skills grid.
    id: 'skills',
    anchor: { kind: 'viewport', x: 0.95, y: 0.66, size: 0.95 },
    pose: pose({ aperture: 0.5, flow: 0.1, bus: 0.35, explode: 0.15, yaw: -1.05, pitch: -0.18, tilt: -0.3, turn: 0.75, level: 0.5, opacity: 0.36, tempo: 0.9 }),
  },
  {
    // Rises into the open space beside the title, reassembling for the finale.
    id: 'achievements',
    anchor: { kind: 'viewport', x: 0.8, y: 0.3, size: 0.6 },
    pose: pose({ aperture: 0.06, flow: 0.5, bus: 0.9, explode: 0.45, yaw: 0.35, pitch: 0.32, tilt: 0.35, turn: -0.3, level: 0.55, opacity: 0.45 }),
  },
  { id: 'contact', anchor: { kind: 'contact' }, pose: pose({ yaw: 0.6, pitch: 0.12, flow: 0.35, bus: 0.6 }) },
];

/* Narrow layouts: text spans the width, so the sculpture keeps to the edges and stays quieter. */
const COMPACT: readonly Station[] = [
  { id: 'top', anchor: { kind: 'hero' }, pose: pose({}) },
  {
    id: 'about',
    anchor: { kind: 'viewport', x: 0.9, y: 0.2, size: 0.72 },
    pose: pose({ aperture: 0.75, flow: 0.25, bus: 0.6, explode: 0.3, yaw: 0.85, tilt: 0.25, level: 0.5, opacity: 0.34, tempo: 0.8 }),
  },
  {
    id: 'experience',
    anchor: { kind: 'viewport', x: 0.06, y: 0.72, size: 0.8 },
    pose: pose({ aperture: 0.55, flow: 0.35, bus: 1, explode: 0.65, yaw: -0.7, pitch: 0.22, turn: -0.45, level: 0.45, opacity: 0.3 }),
  },
  {
    id: 'projects',
    anchor: { kind: 'viewport', x: 0.5, y: 0.5, size: 0.62 },
    pose: pose({ aperture: 1, flow: 1, bus: 0.8, explode: 1, yaw: 1.45, tilt: 0.55, level: 0.45, opacity: 0.3, tempo: 1.4 }),
  },
  {
    id: 'skills',
    anchor: { kind: 'viewport', x: 0.94, y: 0.7, size: 0.8 },
    pose: pose({ aperture: 0.5, flow: 0.1, bus: 0.35, explode: 0.15, yaw: -1.05, turn: 0.75, level: 0.45, opacity: 0.3, tempo: 0.9 }),
  },
  {
    id: 'achievements',
    anchor: { kind: 'viewport', x: 0.9, y: 0.22, size: 0.62 },
    pose: pose({ aperture: 0.06, flow: 0.5, bus: 0.9, explode: 0.45, yaw: 0.35, pitch: 0.32, level: 0.5, opacity: 0.34 }),
  },
  { id: 'contact', anchor: { kind: 'contact' }, pose: pose({ yaw: 0.6, pitch: 0.12, flow: 0.35, bus: 0.6 }) },
];

export const stationsFor = (width: number, height: number): readonly Station[] =>
  width < 900 || height > width * 1.1 ? COMPACT : WIDE;

/** A station is fully reached once its section's top is this far down the viewport. */
const ARRIVAL = 0.25;

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
  }

  if (snap) {
    if (t < 0.5) to = from;
    t = 1;
  }

  const a = stations[from] ?? stations[0];
  const b = stations[to] ?? stations[0];
  if (!a || !b) throw new Error('Journey needs at least one station.');

  const w = easeInOutCubic(t);
  const pa = resolve(a.anchor, context);
  const pb = resolve(b.anchor, context);
  const blend = (key: keyof Pose) => lerp(a.pose[key], b.pose[key], w);

  return {
    x: lerp(pa.x, pb.x, w),
    y: lerp(pa.y, pb.y, w),
    size: lerp(pa.size, pb.size, w),
    explode: blend('explode'),
    yaw: blend('yaw'),
    pitch: blend('pitch'),
    tilt: blend('tilt'),
    turn: blend('turn'),
    level: blend('level'),
    opacity: blend('opacity'),
    tempo: blend('tempo'),
    aperture: blend('aperture'),
    flow: blend('flow'),
    bus: blend('bus'),
    station: w < 0.5 ? from : to,
  };
}

export const restingFrame = (): JourneyFrame => ({ ...pose({}), x: 0, y: 0, size: 600, station: 0 });
