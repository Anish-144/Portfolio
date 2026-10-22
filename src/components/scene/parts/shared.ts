import { Object3D, type InstancedMesh } from 'three';
import type { SculptureMaterials } from '../materials';
import type { QualitySettings } from '../quality';
import type { SceneClock } from '../sceneClock';

export interface PartProps {
  clock: SceneClock;
  materials: SculptureMaterials;
  quality: QualitySettings;
}

const scratch = new Object3D();

/** Writes one transform per instance; `place` receives a reset Object3D to position. */
export function layoutInstances(
  mesh: InstancedMesh,
  count: number,
  place: (index: number, target: Object3D) => void,
): void {
  for (let index = 0; index < count; index++) {
    scratch.position.set(0, 0, 0);
    scratch.rotation.set(0, 0, 0);
    scratch.scale.set(1, 1, 1);
    place(index, scratch);
    scratch.updateMatrix();
    mesh.setMatrixAt(index, scratch.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}
