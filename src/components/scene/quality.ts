export type QualityTier = 'high' | 'low';

export interface QualitySettings {
  tier: QualityTier;
  dpr: [number, number];
  radialSegments: number;
  finCount: number;
  toothCount: number;
  tickCount: number;
  nodeCount: number;
  pulseCount: number;
  /** Detail parts. */
  busCount: number;
  streamCount: number;
  conduitCount: number;
  bearingBalls: number;
  statorCount: number;
  raceBolts: number;
}

const HIGH: QualitySettings = {
  tier: 'high',
  dpr: [1, 2],
  radialSegments: 192,
  finCount: 72,
  toothCount: 120,
  tickCount: 144,
  nodeCount: 30,
  pulseCount: 5,
  busCount: 72,
  streamCount: 220,
  conduitCount: 6,
  bearingBalls: 22,
  statorCount: 40,
  raceBolts: 24,
};

const LOW: QualitySettings = {
  tier: 'low',
  dpr: [1, 1.5],
  radialSegments: 112,
  finCount: 48,
  toothCount: 80,
  tickCount: 96,
  nodeCount: 16,
  pulseCount: 3,
  busCount: 48,
  streamCount: 90,
  conduitCount: 4,
  bearingBalls: 22,
  statorCount: 28,
  raceBolts: 16,
};

/** Picked once per session: phones and low-core devices get lighter geometry and materials. */
export function detectQuality(): QualitySettings {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 820px)').matches;
  const cores = navigator.hardwareConcurrency || 8;
  return (coarse && narrow) || cores <= 4 ? LOW : HIGH;
}
