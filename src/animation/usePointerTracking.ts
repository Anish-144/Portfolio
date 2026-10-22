import { useEffect } from 'react';
import type { MotionState } from './motion';

/**
 * Feeds normalized pointer position into the motion state. Mouse and pen only:
 * on touch screens a finger is scrolling, not aiming, so the scene stays calm.
 */
export function usePointerTracking(motion: MotionState): void {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;

    const reset = () => {
      motion.pointer.x = 0;
      motion.pointer.y = 0;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || reduce.matches) return;
      motion.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      motion.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);

    return () => {
      window.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
      reset();
    };
  }, [motion]);
}
