import type { Project } from '../../content/projects';
import { ArrowIcon, ExternalIcon } from '../ui/icons';
import { TagList } from '../ui/TagList';
import { ProjectVisual } from './ProjectVisual';
import { useProjectRoute } from './projectRoute';

export type ProjectLayout = 'feature' | 'feature-reverse' | 'pair-wide' | 'pair-narrow';

interface ProjectCardProps {
  project: Project;
  layout: ProjectLayout;
}

export function ProjectCard({ project, layout }: ProjectCardProps) {
  const { open } = useProjectRoute();
  const titleId = `project-${project.id}-title`;
  const { repository, demo } = project.links;

  return (
    <article className={`project project--${layout}`} aria-labelledby={titleId}>
      {/* Pointer shortcut; the "View case study" button is the accessible control. */}
      <div className="project__visual" data-reveal-item onClick={() => open(project.id)}>
        <ProjectVisual kind={project.visual} figure={project.figure} index={project.index} />
      </div>

      <div className="project__content" data-reveal-item>
        <p className="project__meta mono-label">
          <span className="project__index">{project.index}</span>
          <span>{project.category}</span>
          {project.context ? <span className="project__context">{project.context}</span> : null}
        </p>

        <h3 id={titleId} className="project__name">
          {project.name}
        </h3>
        <p className="project__tagline">{project.tagline}</p>
        <p className="project__summary">{project.summary}</p>

        <dl className="project__metrics">
          {project.metrics.map((metric) => (
            <div key={metric.label} className="project__metric">
              <dt>{metric.label}</dt>
              <dd data-count>{metric.value}</dd>
            </div>
          ))}
        </dl>

        <TagList items={project.stack} label={`${project.name} technology stack`} size="sm" />

        <div className="project__actions">
          <button type="button" className="project__open" aria-haspopup="dialog" onClick={() => open(project.id)}>
            View case study
            <span className="visually-hidden">: {project.name}</span>
            <ArrowIcon />
          </button>
          {repository ? (
            <a className="project__link" href={repository.href} target="_blank" rel="noreferrer noopener">
              {repository.label}
              <span className="visually-hidden"> for {project.name} (opens in a new tab)</span>
              <ExternalIcon />
            </a>
          ) : null}
          {demo ? (
            <a className="project__link" href={demo.href} target="_blank" rel="noreferrer noopener">
              {demo.label}
              <span className="visually-hidden"> of {project.name} (opens in a new tab)</span>
              <ExternalIcon />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
