import type { ReactNode } from 'react';
import type { SectionId } from '../../config/site';
import { handleSectionLink } from '../../lib/scroll';
import { ArrowIcon } from './icons';
import './ActionLink.css';

type ActionTarget =
  /** In-page section, scrolled to natively with focus handoff. */
  | { to: SectionId; href?: never }
  /** Any other URL, e.g. `mailto:`. */
  | { href: string; to?: never };

type ActionLinkProps = ActionTarget & {
  variant: 'primary' | 'secondary';
  children: ReactNode;
  /** Opt into the intro timeline's fade-up. */
  reveal?: boolean;
};

/** Chamfered call-to-action link. */
export function ActionLink({ variant, children, reveal = false, ...target }: ActionLinkProps) {
  const sectionProps = target.to
    ? { href: `#${target.to}`, onClick: handleSectionLink(target.to) }
    : { href: target.href };

  return (
    <a className={`action action--${variant}`} {...sectionProps} {...(reveal ? { 'data-reveal': 'fade' } : {})}>
      <span className="action__label">{children}</span>
      <ArrowIcon />
    </a>
  );
}
