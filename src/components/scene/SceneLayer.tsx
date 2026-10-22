import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import type { MotionState, SceneMode } from '../../animation/motion';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { BreakdownCallout } from './BreakdownCallout';
import { SceneFallback } from './SceneFallback';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';
import './SceneLayer.css';

// three.js loads in its own chunk so the typography can paint first.
const SceneCanvas = lazy(() => import('./SceneCanvas'));

/** Sections that host the sculpture mark themselves with `data-scene-host`. */
type SceneHost = 'hero' | 'finale';

function useSceneHostsInView(): Record<SceneHost, boolean> {
  const [visible, setVisible] = useState<Record<SceneHost, boolean>>({ hero: true, finale: false });

  useEffect(() => {
    const hosts = Array.from(document.querySelectorAll<HTMLElement>('[data-scene-host]'));
    // The 1px inset treats an edge that merely touches the viewport as out of view.
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((current) => {
          const next = { ...current };
          for (const entry of entries) {
            const host = (entry.target as HTMLElement).dataset.sceneHost as SceneHost;
            next[host] = entry.isIntersecting;
          }
          return next.hero === current.hero && next.finale === current.finale ? current : next;
        });
      },
      { rootMargin: '-1px 0px -1px 0px' },
    );
    hosts.forEach((host) => observer.observe(host));
    return () => observer.disconnect();
  }, []);

  return visible;
}

/** True while a modal surface has locked page scrolling (case study, menu). */
function useScrollLocked(): boolean {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setLocked(root.classList.contains('is-scroll-locked'));
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    update();
    return () => observer.disconnect();
  }, []);

  return locked;
}

interface SceneLayerProps {
  motion: MotionState;
  mode: SceneMode;
  onFallback: () => void;
}

/**
 * Fixed, decorative backdrop: lighting falloff, the WebGL scene (or its CSS
 * fallback), vignette and grain. Sections are transparent, so the sculpture
 * travels behind the whole page. Rendering pauses under modal surfaces, and
 * with reduced motion it only appears in the hero and contact sections.
 */
export function SceneLayer({ motion, mode, onFallback }: SceneLayerProps) {
  const hosts = useSceneHostsInView();
  const reduced = usePrefersReducedMotion();
  const covered = useScrollLocked();
  // The CSS fallback is pinned to the hero; contact draws its own inline copy.
  const active =
    mode === 'webgl' ? !covered && (reduced ? hosts.hero || hosts.finale : true) : hosts.hero;

  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      motion.layer = element;
    },
    [motion],
  );

  return (
    <div ref={attach} className="scene-layer" data-active={active} aria-hidden="true">
      <div className="scene-layer__light" />
      {mode === 'webgl' ? (
        <WebGLErrorBoundary onError={onFallback}>
          <Suspense fallback={null}>
            <SceneCanvas motion={motion} active={active} onContextLost={onFallback} />
          </Suspense>
        </WebGLErrorBoundary>
      ) : (
        <SceneFallback motion={motion} />
      )}
      <div className="scene-layer__vignette" />
      {mode === 'webgl' ? <BreakdownCallout /> : null}
      <div className="scene-layer__grain" />
    </div>
  );
}
