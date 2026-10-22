export const TAU = Math.PI * 2;

export const clamp01 = (value: number): number => (value < 0 ? 0 : value > 1 ? 1 : value);

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** Normalized progress of `t` through the window [start, start + span]. */
export const segment = (t: number, start: number, span: number): number => clamp01((t - start) / span);

export const smoothstep = (edge0: number, edge1: number, t: number): number => {
  const x = clamp01((t - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

export const easeOutQuart = (t: number): number => 1 - (1 - t) ** 4;

export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

export const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

/** Frame-rate independent exponential smoothing. */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));
