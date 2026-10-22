import { Suspense, lazy } from 'react';
import { projectById } from '../../content/projects';
import { useProjectRoute } from './projectRoute';

const CaseStudyDialog = lazy(() => import('./CaseStudyDialog'));

/** Mounts the case-study dialog for the project named in the URL, if any. */
export function CaseStudyHost() {
  const { openId, show, close } = useProjectRoute();
  const project = openId ? projectById(openId) : undefined;
  if (!project) return null;

  return (
    <Suspense fallback={null}>
      <CaseStudyDialog project={project} onClose={close} onNavigate={show} />
    </Suspense>
  );
}
