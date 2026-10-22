import { useLayoutEffect, type RefObject } from 'react';
import type { MotionState } from '../animation/motion';
import type { SectionId } from '../config/site';

/**
 * Publishes the document position of every top-level section, which the 3D
 * journey is keyed to. Re-measures when the content's size or the window changes.
 */
export function useSectionOffsets(contentRef: RefObject<HTMLElement | null>, motion: MotionState): void {
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const scrollY = window.scrollY;
      motion.sections = Array.from(content.querySelectorAll<HTMLElement>(':scope > section[id]')).map((section) => ({
        id: section.id as SectionId,
        top: section.getBoundingClientRect().top + scrollY,
      }));
      motion.invalidate();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(content);
    window.addEventListener('resize', schedule);
    void document.fonts?.ready.then(schedule);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [contentRef, motion]);
}
