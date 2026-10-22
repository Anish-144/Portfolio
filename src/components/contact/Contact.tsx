import { useCallback, useContext, useRef } from 'react';
import { SceneModeContext, useMotion, type StageMetrics } from '../../animation/motion';
import { SECTION_IDS, sectionIndex } from '../../config/site';
import { CONTACT, PROFILE, SOCIAL_LINKS } from '../../content/profile';
import { useStageMeasure } from '../../hooks/useStageMeasure';
import { useDragRotate } from '../../animation/useDragRotate';
import { RotateHint, rotateStageProps } from '../ui/RotateHint';
import { SceneFallback } from '../scene/SceneFallback';
import { ActionLink } from '../ui/ActionLink';
import { ExternalIcon } from '../ui/icons';
import { PendingNote } from '../ui/TagList';
import { CopyEmailButton } from './CopyEmailButton';
import './Contact.css';

/**
 * Closing scene. The section is transparent so the fixed 3D layer shows
 * through: the sculpture reassembles on this section's stage as it arrives.
 */
export function Contact() {
  const motion = useMotion();
  const sceneMode = useContext(SceneModeContext);
  const stageRef = useRef<HTMLDivElement>(null);

  const onStage = useCallback(
    (stage: StageMetrics) => {
      motion.finaleStage = stage;
      motion.invalidate();
    },
    [motion],
  );

  const interactive = sceneMode === 'webgl';
  const dragging = useDragRotate(stageRef, motion, interactive);

  useStageMeasure(stageRef, onStage);

  return (
    <section
      id={SECTION_IDS.contact}
      className="contact"
      aria-labelledby="contact-title"
      tabIndex={-1}
      data-scene-host="finale"
    >
      <div className="shell contact__grid">
        <div className="contact__copy">
          <p className="section-heading__meta mono-label" data-reveal-item aria-hidden="true">
            <span className="section-heading__index">{sectionIndex(SECTION_IDS.contact)}</span>
            <span className="section-heading__rule" />
            <span data-scramble>Contact</span>
          </p>

          <h2 id="contact-title" className="contact__title" data-reveal-heading>
            {CONTACT.title[0]} {CONTACT.title[1]}
          </h2>

          <p className="contact__invitation" data-reveal-item>
            {CONTACT.invitation}
          </p>

          <a className="contact__address" href={`mailto:${PROFILE.email}`} data-reveal-item>
            {PROFILE.email}
          </a>

          <div className="contact__actions" data-reveal-item>
            <ActionLink href={`mailto:${PROFILE.email}`} variant="primary">
              Email me
            </ActionLink>
            <CopyEmailButton email={PROFILE.email} />
          </div>

          <ul className="contact__social" aria-label="Profiles" data-reveal-item>
            {SOCIAL_LINKS.map((link) =>
              link.href ? (
                <li key={link.id}>
                  <a href={link.href} target="_blank" rel="noreferrer noopener">
                    <span className="contact__social-label">{link.label}</span>
                    <span className="contact__social-handle">{link.handle}</span>
                    <span className="visually-hidden"> (opens in a new tab)</span>
                    <ExternalIcon />
                  </a>
                </li>
              ) : (
                <li key={link.id}>
                  <PendingNote>{`${link.label} URL not set: add it in src/content/profile.ts`}</PendingNote>
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Layout cell the sculpture is projected into (or the CSS fallback, inline). */}
        <div
          ref={stageRef}
          className="contact__stage"
          data-interactive={interactive}
          data-dragging={dragging}
          {...rotateStageProps(interactive, 'System core, reassembled')}
        >
          {sceneMode === 'fallback' ? <SceneFallback inline /> : <RotateHint />}
        </div>
      </div>
    </section>
  );
}
