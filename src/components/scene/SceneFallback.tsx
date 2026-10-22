import { useEffect } from 'react';
import { markSceneReady, type MotionState } from '../../animation/motion';
import './SceneFallback.css';

interface SceneFallbackProps {
  /** Present for the fixed hero instance, which also releases the intro timeline. */
  motion?: MotionState;
  /** Inline instances size themselves to their container instead of the hero stage. */
  inline?: boolean;
}

/**
 * CSS-only rendition of the sculpture for devices without WebGL 2 (or after a
 * lost context). The fixed instance sits on the hero stage via CSS custom
 * properties; the inline instance fills whatever container it is placed in.
 */
export function SceneFallback({ motion, inline = false }: SceneFallbackProps) {
  useEffect(() => {
    if (motion) markSceneReady(motion);
  }, [motion]);

  return (
    <div className={`scene-fallback${inline ? ' scene-fallback--inline' : ''}`} aria-hidden="true">
      <div className="scene-fallback__tilt">
        <span className="scene-fallback__ring scene-fallback__ring--dial" />
        <span className="scene-fallback__ring scene-fallback__ring--gear" />
        <span className="scene-fallback__ring scene-fallback__ring--fins" />
        <span className="scene-fallback__ring scene-fallback__ring--segments" />
        <span className="scene-fallback__ring scene-fallback__ring--collar" />
      </div>
      <span className="scene-fallback__core" />
      <span className="scene-fallback__orbit" />
    </div>
  );
}
