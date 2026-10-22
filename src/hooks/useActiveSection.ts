import { useEffect, useState } from 'react';
import type { SectionId } from '../config/site';

/**
 * Scroll-spy: the active section is the last one (in document order) crossing
 * a thin band just above the middle of the viewport.
 */
export function useActiveSection(ids: readonly SectionId[]): SectionId | null {
  const [active, setActive] = useState<SectionId | null>(ids[0] ?? null);

  useEffect(() => {
    const crossing = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) crossing.add(entry.target.id);
          else crossing.delete(entry.target.id);
        }
        const current = ids.filter((id) => crossing.has(id)).at(-1);
        if (current) setActive(current);
      },
      { rootMargin: '-42% 0px -56% 0px' },
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
