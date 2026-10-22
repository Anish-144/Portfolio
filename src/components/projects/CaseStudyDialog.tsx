import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { SECTION_IDS } from '../../config/site';
import { PROJECTS, type Project, type ProjectId } from '../../content/projects';
import { scrollToSection } from '../../lib/scroll';
import { lockScroll } from '../../lib/scrollLock';
import { ArrowIcon, ExternalIcon } from '../ui/icons';
import { TagList } from '../ui/TagList';
import { ArchitectureFlow } from './ArchitectureFlow';
import { ProjectVisual } from './ProjectVisual';
import './CaseStudyDialog.css';

interface CaseStudyDialogProps {
  project: Project;
  onClose: (replaceWith?: string) => void;
  onNavigate: (id: ProjectId) => void;
}

function neighbours(id: ProjectId) {
  const index = PROJECTS.findIndex((project) => project.id === id);
  const count = PROJECTS.length;
  return {
    previous: PROJECTS[(index - 1 + count) % count],
    next: PROJECTS[(index + 1) % count],
  };
}

/**
 * Full case study in a modal <dialog>: focus is contained, Escape and the
 * backdrop close it, ←/→ move between case studies, and focus returns to the
 * control that opened it. Loaded on demand as its own chunk.
 */
export default function CaseStudyDialog({ project, onClose, onNavigate }: CaseStudyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { previous, next } = neighbours(project.id);
  const { caseStudy } = project;

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const unlock = lockScroll();
    return () => {
      unlock();
      if (dialog.open) dialog.close();
    };
  }, []);

  // New case study: start at the top and announce its title.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [project.id]);

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight' && next) onNavigate(next.id);
    if (event.key === 'ArrowLeft' && previous) onNavigate(previous.id);
  };

  const contact = () => {
    onClose(`#${SECTION_IDS.contact}`);
    requestAnimationFrame(() => scrollToSection(SECTION_IDS.contact));
  };

  const sections = [
    { title: 'Problem', body: <p>{caseStudy.problem}</p> },
    {
      title: 'Architecture',
      body: (
        <>
          <p>{caseStudy.architecture.summary}</p>
          <ArchitectureFlow steps={caseStudy.architecture.steps} label={`${project.name} architecture, step by step`} />
        </>
      ),
    },
    {
      title: 'Core features',
      body: (
        <ul className="case__list">
          {caseStudy.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      ),
    },
    {
      title: 'Technology choices',
      body: (
        <dl className="case__tech">
          {caseStudy.technology.map((item) => (
            <div key={item.name}>
              <dt>{item.name}</dt>
              <dd>{item.reason}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      title: 'Challenges & trade-offs',
      body: (
        <div className="case__challenges">
          {caseStudy.challenges.map((challenge) => (
            <div key={challenge.title} className="case__challenge">
              <h4>{challenge.title}</h4>
              <p>{challenge.detail}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Verified results',
      body: (
        <ul className="case__list case__list--results">
          {caseStudy.results.map((result) => (
            <li key={result}>{result}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      className="case"
      aria-labelledby="case-title"
      onClose={(event) => {
        // `close` is dispatched asynchronously; ignore it if the dialog has
        // since been reopened (effect re-runs close and reopen it).
        if (!event.currentTarget.open) onClose();
      }}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="case__frame">
        <div className="case__bar">
          <p className="case__crumb mono-label">
            <span className="case__crumb-index">{project.index}</span> Case study
          </p>
          <div className="case__bar-actions">
            {previous ? (
              <button type="button" className="case__icon-button" onClick={() => onNavigate(previous.id)}>
                <ArrowIcon direction="left" />
                <span className="visually-hidden">Previous case study: {previous.name}</span>
              </button>
            ) : null}
            {next ? (
              <button type="button" className="case__icon-button" onClick={() => onNavigate(next.id)}>
                <ArrowIcon />
                <span className="visually-hidden">Next case study: {next.name}</span>
              </button>
            ) : null}
            <button type="button" className="case__close" onClick={() => onClose()}>
              Close
              <span className="case__close-icon" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="case__scroll">
          <article className="case__article">
            <header className="case__header">
              <p className="case__category mono-label">{project.category}</p>
              <h2 id="case-title" ref={headingRef} className="case__title" tabIndex={-1}>
                {project.name}
              </h2>
              <p className="case__tagline">{project.tagline}</p>
              <p className="case__summary">{project.summary}</p>
            </header>

            <div className="case__visual">
              <ProjectVisual kind={project.visual} figure={project.figure} index={project.index} eager />
            </div>

            <div className="case__grid">
              <aside className="case__meta" aria-label="Project facts">
                <div className="case__meta-block">
                  <h3 className="mono-label">Key facts</h3>
                  <dl className="case__facts">
                    {project.metrics.map((metric) => (
                      <div key={metric.label}>
                        <dt>{metric.label}</dt>
                        <dd>{metric.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {project.context ? (
                  <div className="case__meta-block">
                    <h3 className="mono-label">Context</h3>
                    <p>{project.context}</p>
                  </div>
                ) : null}
                <div className="case__meta-block">
                  <h3 className="mono-label">Stack</h3>
                  <TagList items={project.stack} label={`${project.name} technology stack`} size="sm" />
                </div>
                <div className="case__meta-block">
                  <h3 className="mono-label">Links</h3>
                  <ul className="case__links">
                    {project.links.repository ? (
                      <li>
                        <a href={project.links.repository.href} target="_blank" rel="noreferrer noopener">
                          {project.links.repository.label}
                          <span className="visually-hidden"> (opens in a new tab)</span>
                          <ExternalIcon />
                        </a>
                      </li>
                    ) : null}
                    {project.links.demo ? (
                      <li>
                        <a href={project.links.demo.href} target="_blank" rel="noreferrer noopener">
                          {project.links.demo.label}
                          <span className="visually-hidden"> (opens in a new tab)</span>
                          <ExternalIcon />
                        </a>
                      </li>
                    ) : null}
                    <li>
                      <button type="button" onClick={contact}>
                        Ask for a walkthrough
                        <ArrowIcon />
                      </button>
                    </li>
                  </ul>
                </div>
              </aside>

              <div className="case__sections">
                {sections.map((section, index) => (
                  <section key={section.title} className="case__section" aria-labelledby={`case-section-${index}`}>
                    <h3 id={`case-section-${index}`} className="case__section-title">
                      <span className="case__section-index" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {section.title}
                    </h3>
                    <div className="case__section-body">{section.body}</div>
                  </section>
                ))}
              </div>
            </div>

            {next ? (
              <button type="button" className="case__next" onClick={() => onNavigate(next.id)}>
                <span className="mono-label">Next case study</span>
                <span className="case__next-name">
                  {next.name}
                  <ArrowIcon />
                </span>
              </button>
            ) : null}
          </article>
        </div>
      </div>
    </dialog>
  );
}
