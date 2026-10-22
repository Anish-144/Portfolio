import { SECTION_IDS } from '../../config/site';
import { SOCIAL_LINKS } from '../../content/profile';
import { PROJECTS } from '../../content/projects';
import { ExternalIcon } from '../ui/icons';
import { SectionHeading } from '../ui/SectionHeading';
import { ProjectCard, type ProjectLayout } from './ProjectCard';
import './Projects.css';

/** Two full-width features, then an asymmetric pair; repeats if projects are added. */
const LAYOUTS: readonly ProjectLayout[] = ['feature', 'feature-reverse', 'pair-wide', 'pair-narrow'];

export function Projects() {
  const github = SOCIAL_LINKS.find((link) => link.id === 'github' && link.href);

  return (
    <section id={SECTION_IDS.projects} className="section projects" aria-labelledby="projects-title" tabIndex={-1}>
      <div className="shell">
        <SectionHeading
          section={SECTION_IDS.projects}
          label="Projects"
          title="Selected systems."
          titleId="projects-title"
          intro="Four builds across agentic AI, retrieval-augmented generation, cloud security, and voice-driven learning, each scoped as a complete system from data to interface."
        />

        <div className="projects__list">
          {PROJECTS.map((project, index) => (
            <ProjectCard key={project.id} project={project} layout={LAYOUTS[index % LAYOUTS.length] ?? 'feature'} />
          ))}
        </div>

        {github?.href ? (
          <p className="projects__more" data-reveal-item>
            <span className="mono-label">More work</span>
            <a href={github.href} target="_blank" rel="noreferrer noopener" className="text-link">
              github.com/{github.handle}
              <span className="visually-hidden"> (opens in a new tab)</span>
              <ExternalIcon />
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
