import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { HalfFloatType, UnsignedByteType } from 'three';
import type { SceneClock } from './sceneClock';
import { ScreenBloom } from './screenBloom';

/** Glow strength at rest, and the extra an arrival surge adds at its peak. */
const GLOW = { strength: 1.8, surge: 1.6 } as const;

/**
 * Takes over rendering (frame priority 1): the scene renders to the canvas
 * exactly as before, then the glow is built from that frame and added on top.
 */
export function PostEffects({ clock }: { clock: SceneClock }) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);

  const bloom = useMemo(() => {
    const float = gl.extensions.has('EXT_color_buffer_float') || gl.extensions.has('EXT_color_buffer_half_float');
    return new ScreenBloom(float ? HalfFloatType : UnsignedByteType);
  }, [gl]);

  useEffect(() => () => bloom.dispose(), [bloom]);

  // Matches the renderer's own drawing-buffer rounding.
  useLayoutEffect(() => {
    bloom.setSize(Math.floor(size.width * dpr), Math.floor(size.height * dpr));
  }, [bloom, size.width, size.height, dpr]);

  useFrame(({ scene, camera }) => {
    gl.setRenderTarget(null);
    gl.render(scene, camera);
    bloom.render(gl, (GLOW.strength + GLOW.surge * clock.surge) * clock.lights);
  }, 1);

  return null;
}
