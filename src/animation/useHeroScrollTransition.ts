import { useLayoutEffect, type RefObject } from 'react';
import { MOTION_QUERIES, gsap } from '../lib/gsap';

/**
 * Scrubbed (not pinned) exit as the hero leaves the viewport. Native scrolling
 * is untouched; ScrollTrigger only maps scroll position to progress. The 3D
 * sculpture's own journey is handled in the scene. Elements opt in with
 * `data-scroll`: copy · footer · annotations.
 *
 * Text moves in whole pixels (`snap`) so it never sits on a fractional offset,
 * which would make it render soft while scrolling.
 */
export function useHeroScrollTransition(heroRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const mm = gsap.matchMedia(hero);

    mm.add(MOTION_QUERIES.full, () => {
      const q = gsap.utils.selector(hero);

      gsap
        .timeline({
          defaults: { ease: 'none', duration: 1 },
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        })
        .to(
          q('[data-scroll="copy"]'),
          { y: () => -window.innerHeight * 0.1, autoAlpha: 0, snap: { y: 1 }, ease: 'power1.in', duration: 0.8 },
          0,
        )
        .to(q('[data-scroll="footer"], [data-scroll="annotations"]'), { autoAlpha: 0, duration: 0.25 }, 0);
    });

    return () => mm.revert();
  }, [heroRef]);
}
