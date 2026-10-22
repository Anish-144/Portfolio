import { useEffect, useRef, useState } from 'react';
import { NAV_ITEMS } from '../../config/site';
import { useActiveSection } from '../../hooks/useActiveSection';
import './ScrollRail.css';

const ORDER = NAV_ITEMS.map((item) => item.id);

/**
 * Fixed reading-progress instrument on the right edge: a hairline that fills
 * with scroll, a tick at each section's true position, and the current
 * section's index. Decorative (the nav already conveys location).
 */
export function ScrollRail() {
  const active = useActiveSection(ORDER);
  const fill = useRef<HTMLSpanElement>(null);
  const [marks, setMarks] = useState<number[]>([]);

  useEffect(() => {
    let frame = 0;
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    const paint = () => {
      frame = 0;
      const max = maxScroll();
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (fill.current) fill.current.style.transform = `scaleY(${progress.toFixed(4)})`;
    };

    const measure = () => {
      const max = maxScroll();
      setMarks(
        ORDER.map((id) => {
          const section = document.getElementById(id);
          if (!section || max <= 0) return 0;
          return Math.min(1, (section.getBoundingClientRect().top + window.scrollY) / max);
        }),
      );
      paint();
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const current = NAV_ITEMS.find((item) => item.id === active) ?? NAV_ITEMS[0];
  const last = NAV_ITEMS[NAV_ITEMS.length - 1];

  return (
    <div className="rail" aria-hidden="true" data-reveal="nav">
      <span className="rail__index">{current?.index}</span>
      <div className="rail__track">
        <span ref={fill} className="rail__fill" />
        {marks.map((position, index) => (
          <span
            key={ORDER[index]}
            className="rail__mark"
            data-active={ORDER[index] === active}
            style={{ top: `${(position * 100).toFixed(2)}%` }}
          />
        ))}
      </div>
      <span className="rail__total">{last?.index}</span>
      <span className="rail__label">{current?.label}</span>
    </div>
  );
}
