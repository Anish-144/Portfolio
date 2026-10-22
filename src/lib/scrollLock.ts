let locks = 0;

/**
 * Prevents page scrolling while a modal surface is open. Reference-counted so
 * overlapping dialogs can't unlock each other. Returns an idempotent release.
 */
export function lockScroll(): () => void {
  locks += 1;
  document.documentElement.classList.add('is-scroll-locked');
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) document.documentElement.classList.remove('is-scroll-locked');
  };
}
