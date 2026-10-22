import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type { VisualKind } from '../../content/projects';
import type { IllustrationLayout } from './visuals/ProjectIllustration';
import './ProjectVisual.css';

// Illustrations live in their own chunk and mount only near the viewport.
const ProjectIllustration = lazy(() => import('./visuals/ProjectIllustration'));

/** Below this width the portrait composition keeps labels legible. */
const COMPACT_BELOW = 560;
const ASPECT: Record<IllustrationLayout, string> = { wide: '640 / 440', compact: '360 / 480' };

function useViewportPresence(ref: RefObject<Element | null>, eager: boolean) {
  const [near, setNear] = useState(eager);
  const [visible, setVisible] = useState(false);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          nearObserver.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    // Visible drives ambient animation; drawn latches once a third of the figure is in view.
    const visibleObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setVisible(entry.isIntersecting);
        if (entry.intersectionRatio >= 0.3) setDrawn(true);
      },
      { threshold: [0, 0.3] },
    );
    nearObserver.observe(element);
    visibleObserver.observe(element);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
    };
  }, [ref]);

  return { near, visible, drawn };
}

function useLayoutFor(ref: RefObject<Element | null>): IllustrationLayout {
  const [layout, setLayout] = useState<IllustrationLayout>('wide');

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const pick = (width: number) => setLayout(width < COMPACT_BELOW ? 'compact' : 'wide');
    pick(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) pick(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return layout;
}

interface ProjectVisualProps {
  kind: VisualKind;
  figure: string;
  index: string;
  /** Mount immediately (e.g. inside an open case study). */
  eager?: boolean;
}

/**
 * Framed technical illustration for a project. The composition switches to a
 * portrait layout in narrow containers; the aspect ratio is fixed per layout,
 * so lazy mounting never shifts the page. Lines and bars draw in the first
 * time the figure is in view; ambient animation runs only while visible.
 */
export function ProjectVisual({ kind, figure, index, eager = false }: ProjectVisualProps) {
  const ref = useRef<HTMLElement>(null);
  const { near, visible, drawn } = useViewportPresence(ref, eager);
  const layout = useLayoutFor(ref);

  return (
    <figure ref={ref} className="pvisual" data-kind={kind} data-playing={visible} data-drawn={drawn}>
      <div className="pvisual__canvas" style={{ aspectRatio: ASPECT[layout] } as CSSProperties}>
        {near ? (
          <Suspense fallback={null}>
            <ProjectIllustration kind={kind} layout={layout} />
          </Suspense>
        ) : null}
      </div>
      <figcaption className="pvisual__caption">
        <span>Fig. {index.replace('P/', '')}</span>
        <span>{figure}</span>
      </figcaption>
    </figure>
  );
}
