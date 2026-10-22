import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferAttribute,
  BufferGeometry,
  IcosahedronGeometry,
  Object3D,
  SphereGeometry,
  type Group,
  type InstancedMesh,
  type Vector3,
} from 'three';
import { easeInOutSine, easeOutCubic, lerp, segment, smoothstep } from '../../../animation/easing';
import { buildNetwork } from '../network';
import { useDisposable } from '../useDisposable';
import type { PartProps } from './shared';

const LINE_OPACITY = 0.17;
const PULSE_DURATION = 2.6;

const scratch = new Object3D();

function writeNodes(mesh: InstancedMesh, points: Vector3[], scale: number): void {
  points.forEach((point, index) => {
    scratch.position.copy(point);
    scratch.rotation.set(0, 0, 0);
    scratch.scale.setScalar(scale);
    scratch.updateMatrix();
    mesh.setMatrixAt(index, scratch.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * A sparse lattice of nodes and 1px links orbiting the sculpture, with a few
 * amber packets travelling along the links. Deliberately restrained.
 */
export function NetworkLattice({ clock, materials, quality }: PartProps) {
  const group = useRef<Group>(null);
  const plainNodes = useRef<InstancedMesh>(null);
  const accentNodes = useRef<InstancedMesh>(null);
  const pulses = useRef<InstancedMesh>(null);
  const nodeScale = useRef(-1);
  const pulseCount = quality.pulseCount;

  const graph = useMemo(
    () =>
      buildNetwork({
        count: quality.nodeCount,
        innerRadius: 3.15,
        outerRadius: 3.6,
        neighbors: 2,
        maxEdgeLength: 2.4,
      }),
    [quality.nodeCount],
  );

  const { plain, accents } = useMemo(() => {
    const accentSet = new Set(graph.accents);
    return {
      plain: graph.nodes.filter((_, index) => !accentSet.has(index)),
      accents: graph.nodes.filter((_, index) => accentSet.has(index)),
    };
  }, [graph]);

  const geometry = useDisposable(() => {
    const positions = new Float32Array(graph.edges.length * 6);
    graph.edges.forEach(([a, b], index) => {
      graph.nodes[a]?.toArray(positions, index * 6);
      graph.nodes[b]?.toArray(positions, index * 6 + 3);
    });
    const links = new BufferGeometry();
    links.setAttribute('position', new BufferAttribute(positions, 3));
    return {
      links,
      node: new IcosahedronGeometry(0.036, 1),
      accent: new IcosahedronGeometry(0.046, 1),
      pulse: new SphereGeometry(0.022, 10, 8),
    };
  }, [graph]);

  useLayoutEffect(() => {
    nodeScale.current = -1;
  }, [geometry]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;

    const explode = clock.journey.explode;
    g.rotation.y = clock.time * 0.014;
    g.scale.setScalar(lerp(0.92, 1, easeOutCubic(segment(clock.intro, 0.45, 0.5))) * (1 + 0.3 * explode));
    materials.line.opacity = LINE_OPACITY * smoothstep(0.6, 1, clock.intro) * (1 - 0.6 * explode);

    // Nodes grow in during the entrance; skip the matrix writes once settled.
    const scale = easeOutCubic(segment(clock.intro, 0.5, 0.4));
    if (scale !== nodeScale.current) {
      nodeScale.current = scale;
      if (plainNodes.current) writeNodes(plainNodes.current, plain, scale);
      if (accentNodes.current) writeNodes(accentNodes.current, accents, scale);
    }

    const pulseMesh = pulses.current;
    if (!pulseMesh || graph.edges.length === 0) return;
    for (let index = 0; index < pulseCount; index++) {
      const progress = clock.time / PULSE_DURATION + index / pulseCount + index * 0.37;
      const cycle = Math.floor(progress);
      const t = progress - cycle;
      const edge = graph.edges[(index * 7 + cycle * 5) % graph.edges.length];
      if (!edge) continue;
      // Alternate direction each pass so traffic reads as two-way.
      const [a, b] = cycle % 2 === 0 ? edge : [edge[1], edge[0]];
      const from = graph.nodes[a];
      const to = graph.nodes[b];
      if (!from || !to) continue;
      scratch.position.lerpVectors(from, to, easeInOutSine(t));
      scratch.rotation.set(0, 0, 0);
      scratch.scale.setScalar(Math.sin(Math.PI * t) * clock.power);
      scratch.updateMatrix();
      pulseMesh.setMatrixAt(index, scratch.matrix);
    }
    pulseMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={geometry.links} material={materials.line} />
      <instancedMesh
        ref={plainNodes}
        args={[geometry.node, materials.node, plain.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={accentNodes}
        args={[geometry.accent, materials.amber, accents.length]}
        frustumCulled={false}
      />
      <instancedMesh ref={pulses} args={[geometry.pulse, materials.amber, pulseCount]} frustumCulled={false} />
    </group>
  );
}
