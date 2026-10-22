import { Fragment, useCallback, useContext, useRef } from 'react';
import { SceneModeContext, setSceneSpot, useMotion, type StageMetrics } from '../../animation/motion';
import { useDragRotate } from '../../animation/useDragRotate';
import { useHeroScrollTransition } from '../../animation/useHeroScrollTransition';
import { SECTION_IDS } from '../../config/site';
import { HERO } from '../../content/profile';
import { useStageMeasure } from '../../hooks/useStageMeasure';
import { ActionLink } from '../ui/ActionLink';
import { RotateHint, rotateStageProps } from '../ui/RotateHint';
import { HeroHeadline } from './HeroHeadline';
import { ScrollIndicator } from './ScrollIndicator';
import './Hero.css';

const TITLE_ID = 'hero-title';

export function Hero() {
  const motion = useMotion();
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const onStage = useCallback(
    (stage: StageMetrics) => {
      // The hero is the first section, so document and viewport coordinates match at scroll 0.
      motion.stage = stage;
      setSceneSpot(motion, stage.x, stage.y, Math.min(stage.width, stage.height));
      motion.invalidate();
    },
    [motion],
  );

  const interactive = useContext(SceneModeContext) === 'webgl';
  const dragging = useDragRotate(stageRef, motion, interactive);

  useStageMeasure(stageRef, onStage);
  useHeroScrollTransition(heroRef);

  return (
    <section
      ref={heroRef}
      id={SECTION_IDS.top}
      className="hero"
      aria-labelledby={TITLE_ID}
      data-scene-host="hero"
    >
      <div className="hero__grid">
        <div className="hero__copy" data-scroll="copy">
          <p className="hero__eyebrow mono-label" data-reveal="eyebrow">
            {HERO.eyebrow.map((item, index) => (
              <Fragment key={item}>
                {index > 0 && (
                  <span className="hero__eyebrow-sep" aria-hidden="true">
                    /
                  </span>
                )}
                <span>{item}</span>
              </Fragment>
            ))}
          </p>

          <HeroHeadline id={TITLE_ID} />

          <p className="hero__lede" data-reveal="fade">
            {HERO.lede}
          </p>

          <div className="hero__actions">
            <ActionLink to={SECTION_IDS.projects} variant="primary" reveal>
              {HERO.primaryCta}
            </ActionLink>
            <ActionLink to={SECTION_IDS.contact} variant="secondary" reveal>
              {HERO.secondaryCta}
            </ActionLink>
          </div>
        </div>

        {/* Layout cell the 3D sculpture is projected into; also its rotation surface. */}
        <div
          ref={stageRef}
          className="hero__stage"
          data-interactive={interactive}
          data-dragging={dragging}
          {...rotateStageProps(interactive, 'System core')}
        >
          {/* Wrapper fades on scroll; the labels themselves fade in with the intro. */}
          <div className="hero__annotations" data-scroll="annotations" aria-hidden="true">
            {HERO.annotations.map((label, index) => (
              <span key={label} className={`hero__annotation hero__annotation--${index + 1}`} data-reveal="fade">
                <span className="hero__annotation-index">0{index + 1}</span>
                {label}
              </span>
            ))}
          </div>
          {interactive ? (
            <div className="hero__hint" data-scroll="annotations">
              <span data-reveal="fade">
                <RotateHint />
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hero__footer" data-scroll="footer">
        <ScrollIndicator />
        <p className="hero__caption mono-label" data-reveal="fade" aria-hidden="true">
          {HERO.caption}
        </p>
      </div>
    </section>
  );
}
