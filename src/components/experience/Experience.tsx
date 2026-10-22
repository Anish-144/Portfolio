import { useLayoutEffect, useRef, type RefObject } from 'react';
import { SECTION_IDS } from '../../config/site';
import { EXPERIENCE, periodLabel, type ExperienceEntry } from '../../content/experience';
import { projectById } from '../../content/projects';
import { MOTION_QUERIES, gsap } from '../../lib/gsap';
import { useProjectRoute } from '../projects/projectRoute';
import { SectionHeading } from '../ui/SectionHeading';
import { PendingNote, TagList } from '../ui/TagList';
import './Experience.css';

/** The timeline rail fills with amber as the reader moves through it. */
function useRailProgress(timelineRef: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    const mm = gsap.matchMedia(timeline);
    mm.add(MOTION_QUERIES.full, () => {
      gsap.fromTo(
        timeline.querySelector('.timeline__progress'),
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: timeline, start: 'top 70%', end: 'bottom 60%', scrub: 0.5 },
        },
      );
    });
    return () => mm.revert();
  }, [timelineRef]);
}

function TimelineEntry({ entry }: { entry: ExperienceEntry }) {
  const { open } = useProjectRoute();
  const related = entry.relatedProject ? projectById(entry.relatedProject) : undefined;
  const period = periodLabel(entry.period);

  return (
    <li id={`experience-${entry.id}`} className="timeline__entry">
      <div className="timeline__aside" data-reveal-item>
        <p className="timeline__period mono-label">{period}</p>
        {entry.period.current && entry.period.confirmed ? <p className="timeline__status mono-label">Current</p> : null}
        {!entry.period.confirmed ? <PendingNote>{`Dates unconfirmed: publishing “${period}”`}</PendingNote> : null}
      </div>

      <span className="timeline__node" aria-hidden="true" />

      <article className="timeline__body" data-reveal-item>
        <p className="timeline__org">{entry.organization}</p>
        <h3 className="timeline__role">{entry.role}</h3>
        <p className="timeline__summary">{entry.summary}</p>

        <ul className="timeline__contributions">
          {entry.contributions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="timeline__footer">
          <TagList items={entry.technologies} label={`Technologies at ${entry.organization}`} size="sm" />
          {related ? (
            <button type="button" className="text-link" onClick={() => open(related.id)}>
              Related case study: {related.name}
              <span aria-hidden="true"> →</span>
            </button>
          ) : null}
        </div>
      </article>
    </li>
  );
}

export function Experience() {
  const timelineRef = useRef<HTMLDivElement>(null);
  useRailProgress(timelineRef);

  return (
    <section
      id={SECTION_IDS.experience}
      className="section experience"
      aria-labelledby="experience-title"
      tabIndex={-1}
    >
      <div className="shell">
        <SectionHeading
          section={SECTION_IDS.experience}
          label="Experience"
          title="Engineering in practice."
          titleId="experience-title"
          intro="Internships spanning AI-powered products, voice automation, cloud cost strategy, and multi-cloud delivery."
        />

        <div ref={timelineRef} className="timeline">
          <span className="timeline__rail" aria-hidden="true">
            <span className="timeline__progress" />
          </span>
          <ol className="timeline__list">
            {EXPERIENCE.map((entry) => (
              <TimelineEntry key={entry.id} entry={entry} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
