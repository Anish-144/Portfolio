import { SECTION_IDS } from '../../config/site';
import { CREDENTIALS, HIGHLIGHTS, type Highlight } from '../../content/achievements';
import { SectionHeading } from '../ui/SectionHeading';
import './Achievements.css';

const format = (value: number) => value.toLocaleString('en-US');

/**
 * Rank drawn to scale against the full field (a meter): the fill runs from
 * rank 1 to the placement, over a lighter track of the same hue, with the
 * value labelled directly at the marker.
 */
function PlacementScale({ rank, field }: NonNullable<Highlight['placement']>) {
  const share = (rank / field) * 100;
  return (
    <div
      className="placement"
      role="img"
      aria-label={`Rank about ${format(rank)} of ${format(field)} participants, the top ${share.toFixed(1)} percent.`}
    >
      <div className="placement__value mono-label" aria-hidden="true" style={{ left: `${share}%` }}>
        ≈{format(rank)} · top {share.toFixed(1)}%
      </div>
      <div className="placement__track">
        <span className="placement__fill" style={{ width: `${share}%` }} />
        <span className="placement__marker" style={{ left: `${share}%` }} />
      </div>
      <div className="placement__labels mono-label" aria-hidden="true">
        <span>Rank 1</span>
        <span>{format(field)} participants</span>
      </div>
    </div>
  );
}

export function Achievements() {
  return (
    <section
      id={SECTION_IDS.achievements}
      className="section achievements"
      aria-labelledby="achievements-title"
      tabIndex={-1}
    >
      <div className="shell">
        <SectionHeading
          section={SECTION_IDS.achievements}
          label="Achievements"
          title="Recognition & credentials."
          titleId="achievements-title"
        />

        <div className="awards">
          {HIGHLIGHTS.map((highlight) => (
            <article key={highlight.id} className="award" data-reveal-item>
              <p className="award__year mono-label">{highlight.year}</p>
              <p className="award__figure text-gradient" aria-hidden="true">
                {highlight.figure}
              </p>
              <h3 className="award__title">
                <span className="visually-hidden">{highlight.figure}: </span>
                {highlight.title}
              </h3>
              <p className="award__detail">{highlight.detail}</p>
              {highlight.placement ? <PlacementScale {...highlight.placement} /> : null}
            </article>
          ))}
        </div>

        <ul className="credentials" aria-label="Leadership and certifications">
          {CREDENTIALS.map((credential) => (
            <li key={credential.id} className="credential" data-reveal-item>
              <span className="credential__kind mono-label">{credential.kind}</span>
              <div className="credential__main">
                <h3 className="credential__title">{credential.title}</h3>
                <p className="credential__issuer">{credential.issuer}</p>
                {credential.detail ? <p className="credential__detail">{credential.detail}</p> : null}
              </div>
              {credential.meta ? <span className="credential__meta mono-label">{credential.meta}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
