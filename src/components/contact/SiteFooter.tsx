import { SECTION_IDS } from '../../config/site';
import { PROFILE } from '../../content/profile';
import { handleSectionLink } from '../../lib/scroll';
import { ArrowIcon } from '../ui/icons';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <p className="site-footer__name">
          © {year} {PROFILE.name}
        </p>
        <p className="site-footer__focus mono-label">
          {PROFILE.role} · {PROFILE.focus.join(' · ')}
        </p>
        <a className="site-footer__top mono-label" href={`#${SECTION_IDS.top}`} onClick={handleSectionLink(SECTION_IDS.top)}>
          Back to top
          <ArrowIcon direction="up" />
        </a>
      </div>
    </footer>
  );
}
