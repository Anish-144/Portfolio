import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SECTION_IDS } from '../../config/site';
import { projectById, type ProjectId } from '../../content/projects';

/**
 * Case studies are addressable as `#projects/<id>`: shareable, restorable on
 * reload, and closable with the browser's back button.
 */
const PREFIX = `#${SECTION_IDS.projects}/`;

export const projectHash = (id: ProjectId): string => `${PREFIX}${id}`;

function parse(hash: string): ProjectId | null {
  if (!hash.startsWith(PREFIX)) return null;
  return projectById(decodeURIComponent(hash.slice(PREFIX.length)))?.id ?? null;
}

export interface ProjectRoute {
  openId: ProjectId | null;
  /** Opens a case study as a new history entry. */
  open: (id: ProjectId) => void;
  /** Switches to another case study in place (previous/next). */
  show: (id: ProjectId) => void;
  /**
   * Closes the case study. By default this steps back through history; pass a
   * hash to replace the entry instead (when navigating elsewhere on close, so
   * the browser's scroll restoration can't fight the new scroll).
   */
  close: (replaceWith?: string) => void;
}

export function useProjectRouter(): ProjectRoute {
  const [openId, setOpenId] = useState<ProjectId | null>(() => parse(window.location.hash));
  const pushed = useRef(false);

  useEffect(() => {
    const sync = () => setOpenId(parse(window.location.hash));
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  // A deep link lands behind the dialog on the projects section, so closing it
  // leaves the visitor where the case study lives.
  useEffect(() => {
    if (parse(window.location.hash)) {
      document.getElementById(SECTION_IDS.projects)?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, []);

  const open = useCallback((id: ProjectId) => {
    // Strip any stale section hash from the entry we return to on close, so
    // stepping back never triggers the browser's fragment scroll and focus.
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
    window.history.pushState(null, '', projectHash(id));
    pushed.current = true;
    setOpenId(id);
  }, []);

  const show = useCallback((id: ProjectId) => {
    window.history.replaceState(null, '', projectHash(id));
    setOpenId(id);
  }, []);

  const close = useCallback((replaceWith?: string) => {
    setOpenId(null);
    if (pushed.current && !replaceWith) {
      pushed.current = false;
      window.history.back();
    } else {
      pushed.current = false;
      window.history.replaceState(null, '', replaceWith ?? `#${SECTION_IDS.projects}`);
    }
  }, []);

  return useMemo(() => ({ openId, open, show, close }), [openId, open, show, close]);
}

export const ProjectRouteContext = createContext<ProjectRoute | null>(null);

export function useProjectRoute(): ProjectRoute {
  const route = useContext(ProjectRouteContext);
  if (!route) throw new Error('useProjectRoute must be used inside <ProjectRouteContext.Provider>.');
  return route;
}
