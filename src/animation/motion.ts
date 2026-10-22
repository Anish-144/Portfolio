import { createContext, useContext } from 'react';
import type { SectionId } from '../config/site';

/** A rectangle the sculpture is fitted into, in CSS pixels. */
export interface StageMetrics {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A section's top edge in document coordinates. */
export interface SectionPosition {
  id: SectionId;
  top: number;
}

/** Direct-manipulation input for rotating the sculpture, consumed by the scene each frame. */
export interface RotateInput {
  /** Drag accumulated since the scene last read it, in CSS pixels. */
  dx: number;
  dy: number;
  dragging: boolean;
  /** Touch drags turn around the vertical axis only, so vertical swipes keep scrolling. */
  yawOnly: boolean;
  /** `performance.now()` of the last interaction; the pose eases back after a pause. */
  lastActive: number;
  /** Set after the first interaction (the hint retires). */
  used: boolean;
}

/**
 * Mutable bridge between DOM-side animation (GSAP, pointer, layout) and the
 * render loop. GSAP tweens these numbers; the scene reads them every frame.
 * Kept outside React state on purpose: per-frame values must not re-render.
 */
export interface MotionState {
  /** 0 → 1 scene entrance, driven by the intro timeline once the scene is ready. */
  intro: number;
  /** Pointer target in normalized device coordinates (−1 … 1). */
  pointer: { x: number; y: number };
  rotate: RotateInput;
  /** Hero stage, in viewport coordinates at scroll 0 (the hero is the first section). */
  stage: StageMetrics;
  /** Contact stage, in document coordinates (the scene subtracts scrollY). */
  finaleStage: StageMetrics;
  /** Section tops, measured from layout; the scene's journey is keyed to them. */
  sections: SectionPosition[];
  /** The fixed scene layer, for CSS custom properties that follow the sculpture. */
  layer: HTMLElement | null;
  /** Last light-falloff position written to the layer. */
  spot: { x: number; y: number; size: number };
  sceneReady: boolean;
  /** Replaced by the scene so DOM changes can request a frame in on-demand mode. */
  invalidate: () => void;
  readonly readyListeners: Set<() => void>;
}

export function createMotionState(): MotionState {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return {
    intro: 0,
    pointer: { x: 0, y: 0 },
    rotate: { dx: 0, dy: 0, dragging: false, yawOnly: false, lastActive: -Infinity, used: false },
    stage: { x: width * 0.7, y: height * 0.5, width: width * 0.5, height: height * 0.7 },
    finaleStage: { x: width * 0.7, y: height * 6, width: width * 0.5, height: height * 0.7 },
    sections: [],
    layer: null,
    spot: { x: -1, y: -1, size: -1 },
    sceneReady: false,
    invalidate: () => {},
    readyListeners: new Set(),
  };
}

export function markSceneReady(motion: MotionState): void {
  if (motion.sceneReady) return;
  motion.sceneReady = true;
  motion.readyListeners.forEach((listener) => listener());
  motion.readyListeners.clear();
}

/** Runs `listener` once the scene (WebGL or fallback) has rendered. Returns an unsubscribe. */
export function onSceneReady(motion: MotionState, listener: () => void): () => void {
  if (motion.sceneReady) {
    listener();
    return () => {};
  }
  motion.readyListeners.add(listener);
  return () => {
    motion.readyListeners.delete(listener);
  };
}

/** Light-falloff position for the scene layer's CSS backdrop. Skips sub-pixel changes. */
export function setSceneSpot(motion: MotionState, x: number, y: number, size: number): void {
  const layer = motion.layer;
  const last = motion.spot;
  if (!layer) return;
  if (Math.abs(last.x - x) < 0.5 && Math.abs(last.y - y) < 0.5 && Math.abs(last.size - size) < 1) return;
  motion.spot = { x, y, size };
  layer.style.setProperty('--spot-x', `${x.toFixed(1)}px`);
  layer.style.setProperty('--spot-y', `${y.toFixed(1)}px`);
  layer.style.setProperty('--spot-size', `${size.toFixed(1)}px`);
}

export const MotionContext = createContext<MotionState | null>(null);

export function useMotion(): MotionState {
  const motion = useContext(MotionContext);
  if (!motion) throw new Error('useMotion must be used inside <MotionContext.Provider>.');
  return motion;
}

export type SceneMode = 'webgl' | 'fallback';

/** Whether the real-time scene or the CSS fallback is in use (contact renders its own fallback). */
export const SceneModeContext = createContext<SceneMode>('webgl');
