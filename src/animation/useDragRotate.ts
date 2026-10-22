import { useEffect, useState, type RefObject } from 'react';
import type { MotionState } from './motion';

/** Arrow keys turn the model by this many "pixels" of drag (≈ 30°). */
const KEY_STEP = 62;

/**
 * Lets a layout stage rotate the sculpture behind it: pointer drags (mouse,
 * pen, touch) and arrow keys feed `motion.rotate`, which the scene applies.
 * Touch is horizontal only (the stage sets `touch-action: pan-y`), so a
 * vertical swipe still scrolls the page. Returns whether a drag is underway.
 */
export function useDragRotate(
  stageRef: RefObject<HTMLElement | null>,
  motion: MotionState,
  enabled: boolean,
): boolean {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !enabled) return;

    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const touch = () => {
      motion.rotate.lastActive = performance.now();
      if (!motion.rotate.used) {
        motion.rotate.used = true;
        stage.dataset.rotated = 'true';
      }
      motion.invalidate();
    };

    const end = () => {
      if (pointerId === null) return;
      pointerId = null;
      motion.rotate.dragging = false;
      setDragging(false);
      touch();
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || pointerId !== null) return;
      pointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      stage.setPointerCapture(event.pointerId);
      motion.rotate.dragging = true;
      motion.rotate.yawOnly = event.pointerType === 'touch';
      setDragging(true);
      touch();
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      motion.rotate.dx += event.clientX - lastX;
      motion.rotate.dy += event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      touch();
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerId === pointerId) end();
    };

    const onKey = (event: KeyboardEvent) => {
      const step = event.shiftKey ? KEY_STEP * 3 : KEY_STEP;
      switch (event.key) {
        case 'ArrowLeft':
          motion.rotate.dx -= step;
          break;
        case 'ArrowRight':
          motion.rotate.dx += step;
          break;
        case 'ArrowUp':
          motion.rotate.dy -= step;
          break;
        case 'ArrowDown':
          motion.rotate.dy += step;
          break;
        default:
          return;
      }
      event.preventDefault();
      motion.rotate.yawOnly = false;
      touch();
    };

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('lostpointercapture', onUp);
    stage.addEventListener('keydown', onKey);

    return () => {
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('lostpointercapture', onUp);
      stage.removeEventListener('keydown', onKey);
      end();
    };
  }, [stageRef, motion, enabled]);

  return dragging;
}
