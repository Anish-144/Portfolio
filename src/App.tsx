import { useCallback, useRef, useState } from 'react';
import { MotionContext, SceneModeContext, createMotionState, type SceneMode } from './animation/motion';
import { useIntroTimeline } from './animation/useIntroTimeline';
import { useLayoutRefresh } from './animation/useLayoutRefresh';
import { usePointerTracking } from './animation/usePointerTracking';
import { useReveal } from './animation/useReveal';
import { useSectionOffsets } from './hooks/useSectionOffsets';
import { About } from './components/about/About';
import { Achievements } from './components/achievements/Achievements';
import { Contact } from './components/contact/Contact';
import { SiteFooter } from './components/contact/SiteFooter';
import { Experience } from './components/experience/Experience';
import { Hero } from './components/hero/Hero';
import { ScrollRail } from './components/nav/ScrollRail';
import { SiteNav } from './components/nav/SiteNav';
import { CaseStudyHost } from './components/projects/CaseStudyHost';
import { ProjectRouteContext, useProjectRouter } from './components/projects/projectRoute';
import { Projects } from './components/projects/Projects';
import { SceneLayer } from './components/scene/SceneLayer';
import { Skills } from './components/skills/Skills';
import { canRenderWebGL } from './lib/webgl';

export function App() {
  const [motion] = useState(createMotionState);
  const [sceneMode, setSceneMode] = useState<SceneMode>(() => (canRenderWebGL() ? 'webgl' : 'fallback'));
  const switchToFallback = useCallback(() => setSceneMode('fallback'), []);
  const projectRoute = useProjectRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useIntroTimeline(shellRef, motion);
  usePointerTracking(motion);
  useReveal(mainRef);
  useLayoutRefresh(mainRef);
  useSectionOffsets(mainRef, motion);

  return (
    <MotionContext.Provider value={motion}>
      <SceneModeContext.Provider value={sceneMode}>
        <ProjectRouteContext.Provider value={projectRoute}>
          <div ref={shellRef}>
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <SceneLayer motion={motion} mode={sceneMode} onFallback={switchToFallback} />
            <SiteNav />
            <ScrollRail />
            <main id="main" ref={mainRef} tabIndex={-1}>
              <Hero />
              <About />
              <Experience />
              <Projects />
              <Skills />
              <Achievements />
              <Contact />
            </main>
            <SiteFooter />
            <CaseStudyHost />
          </div>
        </ProjectRouteContext.Provider>
      </SceneModeContext.Provider>
    </MotionContext.Provider>
  );
}
