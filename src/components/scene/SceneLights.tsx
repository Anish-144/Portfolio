import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { AmbientLight, DirectionalLight } from 'three';
import { smoothstep } from '../../animation/easing';
import type { SceneClock } from './sceneClock';

/**
 * Cool key from upper left, hard cool rim from behind right, faint amber kicker
 * from below. The rim comes up first so edges catch light before the faces do.
 * Everything scales with the journey's level, so content sections sit darker.
 */
export function SceneLights({ clock }: { clock: SceneClock }) {
  const ambient = useRef<AmbientLight>(null);
  const key = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);
  const kicker = useRef<DirectionalLight>(null);

  useFrame(() => {
    const level = clock.journey.level;
    if (ambient.current) ambient.current.intensity = 0.06 * clock.lights * level;
    if (key.current) key.current.intensity = 2.1 * clock.lights * level;
    if (rim.current) rim.current.intensity = 3.4 * smoothstep(0, 0.25, clock.intro) * level;
    if (kicker.current) kicker.current.intensity = 1.1 * clock.power * level;
  });

  return (
    <>
      <ambientLight ref={ambient} color="#9ea7b8" intensity={0} />
      <directionalLight ref={key} position={[-6, 7, 7]} color="#f4f6fb" intensity={0} />
      <directionalLight ref={rim} position={[7, 3.5, -7]} color="#d8e2ff" intensity={0} />
      <directionalLight ref={kicker} position={[-5, -6, -3]} color="#ffa24a" intensity={0} />
    </>
  );
}
