import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { StageMetrics } from '../animation/motion';

/**
 * Measures an empty layout cell reserved for the sculpture and reports its
 * center and size in document coordinates (viewport x, document y). Re-measures
 * when the cell resizes, the window resizes, or the page height changes, since
 * content above a cell moves it.
 */
export function useStageMeasure(
  stageRef: RefObject<HTMLElement | null>,
  onMeasure: (stage: StageMetrics) => void,
): void {
  const callback = useRef(onMeasure);

  useLayoutEffect(() => {
    callback.current = onMeasure;
  });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = stage.getBoundingClientRect();
      callback.current({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY + rect.height / 2,
        width: rect.width,
        height: rect.height,
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(stage);
    observer.observe(document.body);
    window.addEventListener('resize', schedule);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [stageRef]);
}
