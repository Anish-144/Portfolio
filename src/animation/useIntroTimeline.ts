import { useLayoutEffect, type RefObject } from 'react';
import { MOTION_QUERIES, ScrollTrigger, gsap } from '../lib/gsap';
import { onSceneReady, type MotionState } from './motion';

const FONT_TIMEOUT_MS = 1400;
const FONTS = ['800 100px "Archivo Variable"', '400 16px "Inter Variable"', '400 12px "JetBrains Mono Variable"'];

/**
 * First-load choreography. Elements opt in with `data-reveal`:
 *   nav · eyebrow · line (masked headline lines) · fade
 * Typography waits for the webfonts (bounded by a timeout) so lines never reflow
 * mid-reveal; the 3D entrance waits for the scene's first rendered frames.
 */
export function useIntroTimeline(scopeRef: RefObject<HTMLElement | null>, motion: MotionState): void {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const mm = gsap.matchMedia(scope);

    mm.add(MOTION_QUERIES, (context) => {
      if (context.conditions?.reduce) {
        motion.intro = 1;
        motion.invalidate();
        return;
      }

      const q = gsap.utils.selector(scope);
      const nav = q('[data-reveal="nav"]');
      const eyebrow = q('[data-reveal="eyebrow"]');
      const lines = q('[data-reveal="line"]');
      const fades = q('[data-reveal="fade"]');

      motion.intro = 0;
      gsap.set(nav, { autoAlpha: 0, y: -12 });
      gsap.set(eyebrow, { clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set(lines, { yPercent: 112 });
      gsap.set(fades, { autoAlpha: 0, y: 18 });

      // Each tween clears its transform when done, so settled text sits on whole pixels.
      const text = gsap
        .timeline({ paused: true, defaults: { ease: 'expo.out' } })
        .to(nav, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.07, clearProps: 'transform' }, 0)
        .to(eyebrow, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut', clearProps: 'clipPath' }, 0.1)
        .to(lines, { yPercent: 0, duration: 1.35, stagger: 0.09, clearProps: 'transform' }, 0.28)
        .to(fades, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09, clearProps: 'transform' }, 0.95);

      // Linear on purpose: each scene layer applies its own easing over a slice of this.
      const scene = gsap.to(motion, { intro: 1, duration: 3.8, ease: 'none', paused: true });
      const unsubscribe = onSceneReady(motion, () => scene.play());

      let cancelled = false;
      let timer = 0;
      const timeout = new Promise<void>((resolve) => {
        timer = window.setTimeout(resolve, FONT_TIMEOUT_MS);
      });
      const fonts = document.fonts
        ? Promise.all(FONTS.map((font) => document.fonts.load(font))).catch(() => undefined)
        : Promise.resolve();

      void Promise.race([fonts, timeout]).then(() => {
        if (cancelled) return;
        text.play();
        ScrollTrigger.refresh();
      });

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        unsubscribe();
      };
    });

    return () => mm.revert();
  }, [scopeRef, motion]);
}
