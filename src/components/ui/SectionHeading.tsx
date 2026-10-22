import type { ReactNode } from 'react';
import { sectionIndex, type SectionId } from '../../config/site';
import './SectionHeading.css';

interface SectionHeadingProps {
  section: SectionId;
  label: string;
  title: string;
  titleId: string;
  intro?: ReactNode;
}

/** Index rule + large editorial title + optional intro, shared by every section. */
export function SectionHeading({ section, label, title, titleId, intro }: SectionHeadingProps) {
  return (
    <header className="section-heading">
      {/* Decorative index; the heading below carries the section's name for assistive tech. */}
      <p className="section-heading__meta mono-label" data-reveal-item aria-hidden="true">
        <span className="section-heading__index">{sectionIndex(section)}</span>
        <span className="section-heading__rule" />
        <span data-scramble>{label}</span>
      </p>
      <h2 id={titleId} className="section-heading__title" data-reveal-heading>
        {title}
      </h2>
      {intro ? (
        <p className="section-heading__intro" data-reveal-item>
          {intro}
        </p>
      ) : null}
    </header>
  );
}
