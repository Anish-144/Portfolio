import {
  BackSide,
  Color,
  CylinderGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  type BufferGeometry,
} from 'three';

interface Panel {
  size: [number, number];
  color: string;
  intensity: number;
  position: [number, number, number];
}

/**
 * A procedural photo studio rendered into a PMREM environment map: long strip
 * lights for crisp highlights on the metal, a soft overhead box, a faint horizon
 * band and one low amber kicker. No HDR files, nothing fetched at runtime.
 */
const PANELS: Panel[] = [
  { size: [14, 5], color: '#ffffff', intensity: 1.3, position: [0, 9, 1] }, // overhead softbox
  { size: [1.4, 16], color: '#f3f6ff', intensity: 6, position: [-8, 1, 4] }, // key strip, camera left
  { size: [0.9, 16], color: '#dfe7ff', intensity: 4.5, position: [7, 0, -6] }, // rim strip, behind right
  { size: [0.6, 12], color: '#ffffff', intensity: 2.2, position: [5, 2, 8] }, // thin front-right accent
  { size: [12, 1.1], color: '#ffffff', intensity: 0.7, position: [0, -2.5, 10] }, // low front fill
  { size: [9, 0.5], color: '#ffa748', intensity: 1.5, position: [-3, -7, -3] }, // warm kicker below
];

export function createStudioScene(): { scene: Scene; dispose: () => void } {
  const scene = new Scene();
  scene.background = new Color('#020203');

  const geometries: BufferGeometry[] = [];
  const materials: MeshBasicMaterial[] = [];

  for (const { size, color, intensity, position } of PANELS) {
    const geometry = new PlaneGeometry(size[0], size[1]);
    const material = new MeshBasicMaterial({
      color: new Color(color).multiplyScalar(intensity),
      side: DoubleSide,
      toneMapped: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    geometries.push(geometry);
    materials.push(material);
  }

  const horizon = new CylinderGeometry(16, 16, 0.3, 64, 1, true);
  const horizonMaterial = new MeshBasicMaterial({
    color: new Color('#ffffff').multiplyScalar(0.55),
    side: BackSide,
    toneMapped: false,
  });
  scene.add(new Mesh(horizon, horizonMaterial));
  geometries.push(horizon);
  materials.push(horizonMaterial);

  return {
    scene,
    dispose: () => {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
