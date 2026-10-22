import { useCallback, useEffect, useState } from 'react';
import { NAV_ITEMS, SECTION_IDS } from '../../config/site';
import { PROFILE } from '../../content/profile';
import { useActiveSection } from '../../hooks/useActiveSection';
import { handleSectionLink } from '../../lib/scroll';
import { MobileMenu } from './MobileMenu';
import './SiteNav.css';

const SCROLLED_THRESHOLD = 24;
const SECTION_ORDER = NAV_ITEMS.map((item) => item.id);
const PRIMARY_ITEMS = NAV_ITEMS.filter((item) => item.id !== SECTION_IDS.contact);

function useScrolledPast(threshold: number): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return scrolled;
}

export function SiteNav() {
  const scrolled = useScrolledPast(SCROLLED_THRESHOLD);
  const active = useActiveSection(SECTION_ORDER);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className="site-nav" data-scrolled={scrolled}>
      <a
        className="site-nav__brand"
        href={`#${SECTION_IDS.top}`}
        onClick={handleSectionLink(SECTION_IDS.top)}
        aria-label={`${PROFILE.name}, ${PROFILE.role}. Back to top`}
        data-reveal="nav"
      >
        <span className="site-nav__name">{PROFILE.name}</span>
        <span className="site-nav__divider" aria-hidden="true">
          /
        </span>
        <span className="site-nav__role">Engineering Portfolio</span>
      </a>

      <nav className="site-nav__primary" aria-label="Primary">
        <ul className="site-nav__links">
          {PRIMARY_ITEMS.map(({ id, label }) => (
            <li key={id} data-reveal="nav">
              <a
                className="site-nav__link"
                href={`#${id}`}
                onClick={handleSectionLink(id)}
                aria-current={active === id ? 'location' : undefined}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="site-nav__actions" data-reveal="nav">
        <a
          className="site-nav__cta"
          href={`#${SECTION_IDS.contact}`}
          onClick={handleSectionLink(SECTION_IDS.contact)}
          aria-current={active === SECTION_IDS.contact ? 'location' : undefined}
        >
          Contact
        </a>
        <button
          type="button"
          className="site-nav__toggle"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen(true)}
        >
          <span className="site-nav__toggle-label">Menu</span>
          <span className="site-nav__toggle-icon" aria-hidden="true" />
        </button>
      </div>

      <MobileMenu open={menuOpen} onClose={closeMenu} active={active} />
    </header>
  );
}
