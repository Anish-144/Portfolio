import { useEffect, type RefObject } from 'react';
import { ScrollTrigger } from '../lib/gsap';

const SETTLE_MS = 160;

/**
 * ScrollTrigger recalculates on window resize, but not when content changes
 * the page height (expanding a skill, late-loading visuals, font swaps).
 * Watch the content and refresh once the layout settles.
 */
export function useLayoutRefresh(contentRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    let timer = 0;
    let lastHeight = content.offsetHeight;

    const observer = new ResizeObserver(() => {
      const height = content.offsetHeight;
      if (Math.abs(height - lastHeight) < 1) return;
      lastHeight = height;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), SETTLE_MS);
    });
    observer.observe(content);

    void document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [contentRef]);
}
