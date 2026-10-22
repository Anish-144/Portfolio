import type { MouseEvent } from 'react';
import { SECTION_IDS, type SectionId } from '../config/site';

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Scrolls to an in-page section using native scrolling (no hijacking), then moves
 * focus there so keyboard and screen-reader users land in the same place.
 */
export function scrollToSection(id: SectionId): void {
  const target = document.getElementById(id);
  if (!target) return;

  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
  if (id === SECTION_IDS.top) {
    window.scrollTo({ top: 0, behavior });
  } else {
    target.scrollIntoView({ behavior, block: 'start' });
  }

  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });

  const url = id === SECTION_IDS.top ? `${location.pathname}${location.search}` : `#${id}`;
  history.replaceState(null, '', url);
}

/** Click handler for `<a href="#id">` that keeps modifier-click behavior intact. */
export function handleSectionLink(id: SectionId) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    scrollToSection(id);
  };
}
