import { useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import type { SceneClock } from './sceneClock';
import { createStudioScene } from './studio';

const ENVIRONMENT_INTENSITY = 1.05;
/** How far (radians) the studio swings either way, and how fast. */
const SWEEP = { angle: 0.75, speed: 0.07 } as const;

/**
 * Bakes the procedural studio into a prefiltered environment map for
 * reflections, then swings it slowly (and a little with the pointer) so
 * highlights glide across the metal instead of sitting still.
 */
export function StudioEnvironment({ clock }: { clock: SceneClock }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    const generator = new PMREMGenerator(gl);
    const studio = createStudioScene();
    const target = generator.fromScene(studio.scene, 0.035);
    scene.environment = target.texture;
    studio.dispose();
    generator.dispose();

    return () => {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
    };
  }, [gl, scene]);

  useFrame(() => {
    scene.environmentIntensity = ENVIRONMENT_INTENSITY * clock.lights * clock.journey.level;
    scene.environmentRotation.y = Math.sin(clock.time * SWEEP.speed) * SWEEP.angle + clock.pointerX * 0.3;
    scene.environmentRotation.x = clock.pointerY * 0.12;
  });

  return null;
}
