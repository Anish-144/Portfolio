import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import type { MotionState } from '../../animation/motion';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { CameraRig } from './CameraRig';
import { ClockDriver } from './ClockDriver';
import { detectQuality } from './quality';
import { createSceneClock } from './sceneClock';
import { SceneLights } from './SceneLights';
import { Sculpture } from './Sculpture';
import { StudioEnvironment } from './StudioEnvironment';

interface SceneCanvasProps {
  motion: MotionState;
  /** False once the hero has scrolled fully out of view: rendering pauses. */
  active: boolean;
  onContextLost: () => void;
}

interface SceneBridgeProps extends Pick<SceneCanvasProps, 'motion' | 'onContextLost'> {
  reduced: boolean;
}

/** Connects the R3F root to the outside world: on-demand invalidation and context loss. */
function SceneBridge({ motion, onContextLost, reduced }: SceneBridgeProps) {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    motion.invalidate = () => invalidate();
    invalidate();
    return () => {
      motion.invalidate = () => {};
    };
  }, [motion, invalidate]);

  // On-demand rendering (reduced motion): the finale stage scrolls with the
  // page, so each scroll needs a fresh frame. A paused loop ignores these.
  useEffect(() => {
    if (!reduced) return;
    const onScroll = () => invalidate();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduced, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLoss = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    canvas.addEventListener('webglcontextlost', handleLoss);
    return () => canvas.removeEventListener('webglcontextlost', handleLoss);
  }, [gl, onContextLost]);

  return null;
}

export default function SceneCanvas({ motion, active, onContextLost }: SceneCanvasProps) {
  const [quality] = useState(detectQuality);
  const [clock] = useState(createSceneClock);
  const reduced = usePrefersReducedMotion();
  const frameloop = !active ? 'never' : reduced ? 'demand' : 'always';

  return (
    <Canvas
      className="scene-canvas"
      dpr={quality.dpr}
      frameloop={frameloop}
      resize={{ scroll: false }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 26, near: 0.1, far: 100, position: [0, 0, 20] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
      }}
    >
      <SceneBridge motion={motion} onContextLost={onContextLost} reduced={reduced} />
      <ClockDriver clock={clock} motion={motion} reduced={reduced} />
      <StudioEnvironment clock={clock} />
      <SceneLights clock={clock} />
      <CameraRig clock={clock} motion={motion} />
      <Sculpture clock={clock} quality={quality} motion={motion} />
    </Canvas>
  );
}
