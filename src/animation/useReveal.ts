import { useLayoutEffect, type RefObject } from 'react';
import { MOTION_QUERIES, SplitText, gsap } from '../lib/gsap';

/**
 * Scroll-entry reveals for everything below the hero. Elements opt in with:
 *   data-reveal-heading — masked line-by-line rise (SplitText, re-splits on resize)
 *   data-reveal-item    — fade and rise, staggered with neighbours entering together
 *
 * Hidden states are applied by script only, so content stays visible if
 * JavaScript fails. An IntersectionObserver reports every element's state on
 * first observation, so anything already scrolled past (deep links, restored
 * scroll positions) is shown immediately instead of waiting for an entry that
 * never comes.
 */
export function useReveal(scopeRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const mm = gsap.matchMedia(scope);

    mm.add(MOTION_QUERIES.full, () => {
      const q = gsap.utils.selector(scope);
      const headings = q('[data-reveal-heading]') as HTMLElement[];
      const items = q('[data-reveal-item]') as HTMLElement[];
      const headingTweens = new Map<Element, gsap.core.Tween>();
      const revealed = new Set<Element>();

      headings.forEach((heading) => {
        SplitText.create(heading, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'split-line',
          autoSplit: true,
          onSplit(self) {
            const tween = gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.25,
              ease: 'expo.out',
              stagger: 0.08,
              paused: !revealed.has(heading),
            });
            headingTweens.set(heading, tween);
            // Returning the tween lets SplitText carry its progress across re-splits.
            return tween;
          },
        });
      });

      gsap.set(items, { autoAlpha: 0, y: 32 });
      document.documentElement.classList.add('reveal-armed');

      const queue: Element[] = [];
      let frame = 0;

      // Mono labels marked `data-scramble` decode into place, terminal-style.
      const decode = (root: Element) => {
        root.querySelectorAll<HTMLElement>('[data-scramble]').forEach((label) => {
          const text = label.dataset.scrambleText ?? label.textContent ?? '';
          label.dataset.scrambleText = text;
          gsap.to(label, {
            duration: 1.1,
            ease: 'none',
            scrambleText: { text, chars: 'ABCDEF0123456789/#<>', revealDelay: 0.25, speed: 0.55 },
          });
        });
      };

      // Whole-number metrics ("1,000", "4+") count up from zero; others are left alone.
      const countUp = (root: Element) => {
        root.querySelectorAll<HTMLElement>('[data-count]').forEach((element) => {
          const text = element.dataset.countText ?? element.textContent ?? '';
          const match = /^(\d[\d,]*)(\+?)$/.exec(text.trim());
          if (!match?.[1]) return;
          element.dataset.countText = text;
          const target = Number(match[1].replace(/,/g, ''));
          const suffix = match[2] ?? '';
          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.4,
            ease: 'power3.out',
            onUpdate: () => {
              element.textContent = `${Math.round(counter.value).toLocaleString('en-US')}${suffix}`;
            },
          });
        });
      };

      const markRevealed = (element: Element) => element.setAttribute('data-revealed', '');

      const flush = () => {
        frame = 0;
        const batch = queue.splice(0);
        const batchItems = batch.filter((element) => element.hasAttribute('data-reveal-item'));
        if (batchItems.length) {
          gsap.to(batchItems, {
            autoAlpha: 1,
            y: 0,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.08,
            overwrite: true,
            // Drop the finished transform so settled text renders on whole pixels.
            clearProps: 'transform',
          });
          batchItems.forEach((item) => {
            markRevealed(item);
            decode(item);
            countUp(item);
          });
        }
        batch.forEach((element) => headingTweens.get(element)?.play());
      };

      const showNow = (element: Element) => {
        markRevealed(element);
        if (element.hasAttribute('data-reveal-item')) gsap.set(element, { autoAlpha: 1, clearProps: 'transform' });
        else headingTweens.get(element)?.progress(1);
      };

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const passed = entry.boundingClientRect.bottom < (entry.rootBounds?.top ?? 0);
            if (!entry.isIntersecting && !passed) continue;
            observer.unobserve(entry.target);
            revealed.add(entry.target);
            if (passed) showNow(entry.target);
            else queue.push(entry.target);
          }
          if (queue.length && !frame) frame = requestAnimationFrame(flush);
        },
        { rootMargin: '0px 0px -10% 0px' },
      );

      const pending = new Set<Element>([...headings, ...items]);
      pending.forEach((element) => observer.observe(element));

      // A jump (find-in-page, instant scroll) can carry an element from below the
      // viewport to above it without it ever intersecting; catch those on scroll.
      let sweepFrame = 0;
      const sweep = () => {
        sweepFrame = 0;
        pending.forEach((element) => {
          if (revealed.has(element)) {
            pending.delete(element);
          } else if (element.getBoundingClientRect().bottom < 0) {
            observer.unobserve(element);
            revealed.add(element);
            pending.delete(element);
            showNow(element);
          }
        });
        if (pending.size === 0) window.removeEventListener('scroll', onScroll);
      };
      const onScroll = () => {
        if (!sweepFrame) sweepFrame = requestAnimationFrame(sweep);
      };
      window.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        document.documentElement.classList.remove('reveal-armed');
        observer.disconnect();
        window.removeEventListener('scroll', onScroll);
        cancelAnimationFrame(frame);
        cancelAnimationFrame(sweepFrame);
      };
    });

    return () => mm.revert();
  }, [scopeRef]);
}
