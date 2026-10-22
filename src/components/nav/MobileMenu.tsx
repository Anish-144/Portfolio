import { useLayoutEffect, useRef, type MouseEvent } from 'react';
import { NAV_ITEMS, type SectionId } from '../../config/site';
import { PROFILE, SOCIAL_LINKS } from '../../content/profile';
import { scrollToSection } from '../../lib/scroll';
import { lockScroll } from '../../lib/scrollLock';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  active: SectionId | null;
}

/**
 * Full-screen menu for narrow viewports. A modal <dialog> provides focus
 * containment, Escape to close, and focus return to the toggle.
 */
export function MobileMenu({ open, onClose, active }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    const unlock = lockScroll();
    return () => {
      unlock();
      if (dialog.open) dialog.close();
    };
  }, [open]);

  const go = (id: SectionId) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onClose();
    // Wait for the dialog to close (and scrolling to unlock) before moving.
    requestAnimationFrame(() => scrollToSection(id));
  };

  return (
    <dialog
      ref={dialogRef}
      id="site-menu"
      className="menu"
      aria-label="Site menu"
      onClose={(event) => {
        // Ignore a stale, asynchronously dispatched `close` if the menu was reopened.
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        // Clicks on the backdrop area (the dialog element itself) close the menu.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="menu__panel">
        <div className="menu__top">
          <span className="menu__title mono-label">{PROFILE.name}</span>
          <button type="button" className="menu__close" onClick={onClose}>
            <span className="menu__close-label">Close</span>
            <span className="menu__close-icon" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Site sections">
          <ol className="menu__list">
            {NAV_ITEMS.map(({ id, label, index }) => (
              <li key={id}>
                <a
                  className="menu__link"
                  href={`#${id}`}
                  onClick={go(id)}
                  aria-current={active === id ? 'location' : undefined}
                >
                  <span className="menu__index" aria-hidden="true">
                    {index}
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="menu__footer">
          <a className="menu__email" href={`mailto:${PROFILE.email}`}>
            {PROFILE.email}
          </a>
          <ul className="menu__social">
            {SOCIAL_LINKS.filter((link) => link.href).map((link) => (
              <li key={link.id}>
                <a href={link.href ?? undefined} target="_blank" rel="noreferrer noopener">
                  {link.label}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  );
}
