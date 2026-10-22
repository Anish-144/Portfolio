import { BufferGeometry, LatheGeometry, Shape, ShapeGeometry, Vector2 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TAU } from '../../animation/easing';

/**
 * Procedural, machined-looking parts. Rings are lathed from 2D profiles around
 * the Y axis, then turned so their axis points along +Z (toward the camera).
 */

export interface RingProfile {
  inner: number;
  outer: number;
  depth: number;
  chamfer: number;
}

function chamferedOutline({ inner, outer, depth, chamfer }: RingProfile): Vector2[] {
  const h = depth / 2;
  const c = Math.min(chamfer, (outer - inner) / 3, h * 0.8);
  // Counter-clockwise in (radius, axial) space so lathe normals face outward.
  return [
    new Vector2(inner + c, -h),
    new Vector2(outer - c, -h),
    new Vector2(outer, -h + c),
    new Vector2(outer, h - c),
    new Vector2(outer - c, h),
    new Vector2(inner + c, h),
    new Vector2(inner, h - c),
    new Vector2(inner, -h + c),
  ];
}

/**
 * Doubles every interior point. LatheGeometry averages normals across adjacent
 * profile segments; a zero-length segment between duplicates keeps edges crisp.
 */
function hardEdged(points: Vector2[], close: boolean): Vector2[] {
  const first = points[0];
  const path = close && first ? [...points, first] : points;
  const result: Vector2[] = [];
  path.forEach((point, index) => {
    result.push(point.clone());
    if (index > 0 && index < path.length - 1) result.push(point.clone());
  });
  return result;
}

const faceCamera = (geometry: BufferGeometry): BufferGeometry => geometry.rotateX(Math.PI / 2);

/** After `faceCamera`, a lathe angle φ appears at screen-plane angle φ − π/2. */
export const latheToPlaneAngle = (phi: number): number => phi - Math.PI / 2;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Failed to merge sculpture geometry.');
  return merged;
}

/** A full chamfered washer, like a machined bearing race. */
export function createMachinedRing(profile: RingProfile, radialSegments: number): BufferGeometry {
  return faceCamera(new LatheGeometry(hardEdged(chamferedOutline(profile), true), radialSegments));
}

/** One arc of a chamfered ring, capped at both ends. */
function createRingArc(profile: RingProfile, phiStart: number, phiLength: number, radialSegments: number) {
  const outline = chamferedOutline(profile);
  const body = new LatheGeometry(hardEdged(outline, true), radialSegments, phiStart, phiLength);

  // Caps are the 2D profile, swung into the start and end planes of the arc.
  // The profile is symmetric about y = 0, so flipping it reverses the normal.
  const shape = new Shape(outline);
  const startCap = new ShapeGeometry(shape).rotateY(phiStart - Math.PI / 2);
  const endCap = new ShapeGeometry(shape)
    .rotateX(Math.PI)
    .rotateY(phiStart + phiLength - Math.PI / 2);

  return merge([body, startCap, endCap]);
}

export interface SegmentSpec {
  /** Number of slots this segment spans. */
  span: number;
  /** Which material bucket the segment belongs to. */
  variant: 0 | 1;
}

export interface SegmentedRing {
  geometries: [BufferGeometry, BufferGeometry];
  /** Lathe angle at the middle of each segment, in layout order. */
  centers: number[];
}

/** A ring broken into machined arcs with even gaps, merged per material variant. */
export function createSegmentedRing(
  profile: RingProfile,
  layout: readonly SegmentSpec[],
  gap: number,
  segmentsPerTurn: number,
): SegmentedRing {
  const slots = layout.reduce((total, spec) => total + spec.span, 0);
  const slotAngle = TAU / slots;
  const buckets: [BufferGeometry[], BufferGeometry[]] = [[], []];
  const centers: number[] = [];

  let cursor = 0;
  for (const { span, variant } of layout) {
    const phiStart = cursor * slotAngle + gap / 2;
    const phiLength = span * slotAngle - gap;
    const radialSegments = Math.max(8, Math.round((segmentsPerTurn * phiLength) / TAU));
    buckets[variant].push(createRingArc(profile, phiStart, phiLength, radialSegments));
    centers.push(phiStart + phiLength / 2);
    cursor += span;
  }

  return {
    geometries: [faceCamera(merge(buckets[0])), faceCamera(merge(buckets[1]))],
    centers,
  };
}

export interface RibbedBandProfile {
  inner: number;
  outer: number;
  depth: number;
  ribs: number;
  ribDepth: number;
}

/** A thick collar whose outer wall is cut into raised lands and V-grooves. */
export function createRibbedBand(
  { inner, outer, depth, ribs, ribDepth }: RibbedBandProfile,
  radialSegments: number,
): BufferGeometry {
  const h = depth / 2;
  const pitch = depth / ribs;
  const bevel = pitch * 0.2;
  const valley = outer - ribDepth;

  const points = [new Vector2(inner, -h), new Vector2(valley, -h)];
  for (let rib = 0; rib < ribs; rib++) {
    const y0 = -h + rib * pitch;
    points.push(
      new Vector2(outer, y0 + bevel),
      new Vector2(outer, y0 + pitch - bevel),
      new Vector2(valley, y0 + pitch),
    );
  }
  points.push(new Vector2(inner, h));

  return faceCamera(new LatheGeometry(hardEdged(points, true), radialSegments));
}

export interface ShellProfile {
  outer: number;
  inner: number;
  /** Half-angle of the equatorial slit, in radians. */
  gap: number;
}

/**
 * Upper half of a thick spherical shell that stops short of the equator.
 * Mirror it for the lower half; the space between is the glowing slit.
 * Axis stays on Y so the slit reads as a horizontal visor.
 */
export function createShellCap({ outer, inner, gap }: ShellProfile, radialSegments: number): BufferGeometry {
  const rimAngle = Math.PI / 2 - gap;
  const steps = 40;
  const innerArc: Vector2[] = [];
  const outerArc: Vector2[] = [];

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * rimAngle;
    innerArc.push(new Vector2(inner * Math.sin(theta), inner * Math.cos(theta)));
    outerArc.push(new Vector2(outer * Math.sin(theta), outer * Math.cos(theta)));
  }
  outerArc.reverse();

  const rimInner = innerArc[innerArc.length - 1];
  const rimOuter = outerArc[0];
  if (!rimInner || !rimOuter) throw new Error('Invalid shell profile.');

  // Inner surface pole → rim, across the rim face, outer surface rim → pole.
  // Duplicated rim points keep the machined lip crisp.
  const points = [...innerArc, rimInner.clone(), rimOuter.clone(), ...outerArc];
  return new LatheGeometry(points, radialSegments);
}
