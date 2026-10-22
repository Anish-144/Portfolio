import { SECTION_IDS } from '../../config/site';
import { ABOUT, PROFILE } from '../../content/profile';
import { SectionHeading } from '../ui/SectionHeading';
import './About.css';

const SPEC: ReadonlyArray<{ term: string; value: string }> = [
  { term: 'Name', value: PROFILE.name },
  { term: 'Role', value: PROFILE.role },
  { term: 'Focus', value: PROFILE.focus.join(' · ') },
  { term: 'Degree', value: PROFILE.education.degree },
  { term: 'University', value: `${PROFILE.education.institution}, ${PROFILE.education.location}` },
  { term: 'Graduation', value: PROFILE.education.graduation },
];

export function About() {
  return (
    <section id={SECTION_IDS.about} className="section about" aria-labelledby="about-title" tabIndex={-1}>
      <div className="shell">
        <SectionHeading section={SECTION_IDS.about} label="About" title={ABOUT.title} titleId="about-title" />

        <p className="about__statement" data-reveal-item>
          <span className="about__statement-lead">{ABOUT.statement.lead}</span>{' '}
          <span className="about__statement-rest">{ABOUT.statement.rest}</span>
        </p>

        <div className="about__body">
          <dl className="about__spec" data-reveal-item>
            {SPEC.map(({ term, value }) => (
              <div key={term} className="about__spec-row">
                <dt className="mono-label">{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="about__detail">
            {ABOUT.paragraphs.map((paragraph) => (
              <p key={paragraph} className="about__paragraph" data-reveal-item>
                {paragraph}
              </p>
            ))}

            <ol className="about__focus" aria-label="Areas of focus">
              {ABOUT.focusAreas.map((area, index) => (
                <li key={area.title} className="about__focus-item" data-reveal-item>
                  <span className="about__focus-index mono-label">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="about__focus-title">{area.title}</h3>
                  <p className="about__focus-detail">{area.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ul className="about__principles" aria-label="Engineering principles">
          {ABOUT.principles.map((principle) => (
            <li key={principle.title} className="about__principle" data-reveal-item>
              <span className="about__principle-title">{principle.title}</span>
              <span className="about__principle-detail">{principle.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
