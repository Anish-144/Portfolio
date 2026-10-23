import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, type PerspectiveCamera } from 'three';
import { easeOutQuart, lerp, segment } from '../../animation/easing';
import { setCallout, setSceneSpot, type MotionState } from '../../animation/motion';
import type { SceneClock } from './sceneClock';

const REST_ELEVATION = 0.07;

interface CameraRigProps {
  clock: SceneClock;
  motion: MotionState;
}

/**
 * Orbits the camera around the sculpture (always at the origin) and uses a lens
 * shift (`setViewOffset`) to project it onto the journey's framing circle. The
 * sculpture is therefore never viewed off-axis, and layout (hero and contact
 * stages) or the station table decides where it sits.
 */
export function CameraRig({ clock, motion }: CameraRigProps) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;

  useFrame(({ size }) => {
    const { width, height } = size;
    if (width === 0 || height === 0) return;

    const { journey } = clock;
    const intro = easeOutQuart(segment(clock.intro, 0, 0.92));

    const centerX = journey.x + (1 - intro) * width * 0.04;
    const centerY = journey.y;
    const stageSize = Math.max(journey.size, 160);

    const tanHalfFov = Math.tan(MathUtils.degToRad(camera.fov / 2));
    // Each station frames its own featured component: the teardown zooms in and out.
    const distance = ((journey.fit * height) / (stageSize * tanHalfFov)) * lerp(1.55, 1, intro);
    // A slow, uneven drift, like a camera operator holding the shot.
    const t = clock.time;
    const driftYaw = Math.sin(t * 0.23) * 0.016 + Math.sin(t * 0.11 + 1.3) * 0.012;
    const driftPitch = Math.sin(t * 0.19 + 0.7) * 0.011;
    const azimuth = lerp(-0.8, 0, intro) + journey.yaw + clock.pointerX * 0.05 + driftYaw;
    const elevation = lerp(0.38, REST_ELEVATION, intro) + journey.pitch + clock.pointerY * 0.035 + driftPitch;

    camera.position.set(
      distance * Math.sin(azimuth) * Math.cos(elevation),
      distance * Math.sin(elevation),
      distance * Math.cos(azimuth) * Math.cos(elevation),
    );
    camera.lookAt(0, 0, 0);
    camera.near = Math.max(0.1, distance - 9);
    camera.far = distance + 12;
    camera.setViewOffset(width, height, width / 2 - centerX, height / 2 - centerY, width, height);

    // Keep the CSS light falloff behind the sculpture.
    setSceneSpot(motion, centerX, centerY, stageSize);

    // A world radius r at the origin projects to r · stageSize / (2 · fit) pixels.
    setCallout(motion, {
      x: centerX,
      y: centerY,
      ring: (stageSize / 2) * (journey.focus / journey.fit),
      opacity: journey.calloutOpacity,
    });
  });

  return null;
}
