import { useState } from 'react';
import { SECTION_IDS } from '../../config/site';
import { EXPERIENCE } from '../../content/experience';
import { projectById } from '../../content/projects';
import { SKILL_GROUPS, type Skill, type SkillUse } from '../../content/skills';
import { handleSectionLink } from '../../lib/scroll';
import { useProjectRoute } from '../projects/projectRoute';
import { SectionHeading } from '../ui/SectionHeading';
import './Skills.css';

function UseLink({ use }: { use: SkillUse }) {
  const { open } = useProjectRoute();

  if (use.kind === 'project') {
    const project = projectById(use.id);
    if (!project) return null;
    return (
      <button type="button" className="skill__use" onClick={() => open(project.id)}>
        {project.name}
        <span className="skill__use-kind">Case study</span>
      </button>
    );
  }

  const role = EXPERIENCE.find((entry) => entry.id === use.id);
  if (!role) return null;
  return (
    <a className="skill__use" href={`#${SECTION_IDS.experience}`} onClick={handleSectionLink(SECTION_IDS.experience)}>
      {role.organization}
      <span className="skill__use-kind">Experience</span>
    </a>
  );
}

interface SkillRowProps {
  skill: Skill;
  rowId: string;
  expanded: boolean;
  onToggle: () => void;
}

function SkillRow({ skill, rowId, expanded, onToggle }: SkillRowProps) {
  const uses = skill.usedIn ?? [];

  if (uses.length === 0) {
    return (
      <li className="skill">
        <span className="skill__name">{skill.name}</span>
      </li>
    );
  }

  const panelId = `skill-uses-${rowId}`;
  return (
    <li className="skill skill--interactive" data-expanded={expanded}>
      <button type="button" className="skill__toggle" aria-expanded={expanded} aria-controls={panelId} onClick={onToggle}>
        <span className="skill__name">{skill.name}</span>
        <span className="skill__count" aria-hidden="true">
          {String(uses.length).padStart(2, '0')}
        </span>
        <span className="visually-hidden">, applied in {uses.length} {uses.length === 1 ? 'place' : 'places'}</span>
        <span className="skill__plus" aria-hidden="true" />
      </button>
      <div id={panelId} className="skill__uses" hidden={!expanded}>
        <span className="skill__uses-label mono-label">Applied in</span>
        <ul>
          {uses.map((use) => (
            <li key={`${use.kind}-${use.id}`}>
              <UseLink use={use} />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function Skills() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section id={SECTION_IDS.skills} className="section skills" aria-labelledby="skills-title" tabIndex={-1}>
      <div className="shell">
        <SectionHeading
          section={SECTION_IDS.skills}
          label="Skills"
          title="The working toolkit."
          titleId="skills-title"
          intro="Grouped by the kind of work they do, with no proficiency bars. Skills with a count open to show where they have been applied."
        />

        <div className="skills__grid">
          {SKILL_GROUPS.map((group, groupIndex) => (
            <section key={group.id} className="skills__group" aria-labelledby={`skills-${group.id}`} data-reveal-item>
              <header className="skills__head">
                <span className="skills__index mono-label">{String(groupIndex + 1).padStart(2, '0')}</span>
                <h3 id={`skills-${group.id}`} className="skills__title">
                  {group.title}
                </h3>
                <p className="skills__summary">{group.summary}</p>
              </header>

              <ul className="skills__list">
                {group.skills.map((skill) => {
                  const rowId = `${group.id}-${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                  return (
                    <SkillRow
                      key={rowId}
                      skill={skill}
                      rowId={rowId}
                      expanded={expanded === rowId}
                      onToggle={() => setExpanded((current) => (current === rowId ? null : rowId))}
                    />
                  );
                })}
              </ul>

              {group.tools ? (
                <p className="skills__tools">
                  <span className="mono-label">Tools</span>
                  <span>{group.tools.join(' · ')}</span>
                </p>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
