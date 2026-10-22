import { Vector3 } from 'three';

export interface NetworkGraph {
  nodes: Vector3[];
  edges: Array<[number, number]>;
  /** Node indices rendered as amber "active" nodes. */
  accents: number[];
}

/** Small deterministic PRNG so the layout is identical on every load. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface NetworkOptions {
  count: number;
  innerRadius: number;
  outerRadius: number;
  neighbors: number;
  maxEdgeLength: number;
  seed?: number;
}

/**
 * Nodes on a loose spherical shell around the sculpture (Fibonacci-distributed,
 * then thinned), linked to their nearest neighbours. The cone in front of the
 * core is kept clear so the lattice never sits between the viewer and the core.
 */
export function buildNetwork({
  count,
  innerRadius,
  outerRadius,
  neighbors,
  maxEdgeLength,
  seed = 1729,
}: NetworkOptions): NetworkGraph {
  const random = mulberry32(seed);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const candidates = count * 4;
  const nodes: Vector3[] = [];

  for (let i = 0; i < candidates && nodes.length < count; i++) {
    const y = 1 - (i / (candidates - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const direction = new Vector3(Math.cos(theta) * ring, y, Math.sin(theta) * ring);
    if (direction.z > 0.42 || Math.abs(direction.y) > 0.86) continue;
    if (random() < 0.4) continue;
    nodes.push(direction.multiplyScalar(innerRadius + random() * (outerRadius - innerRadius)));
  }

  const seen = new Set<string>();
  const edges: Array<[number, number]> = [];
  nodes.forEach((node, a) => {
    nodes
      .map((other, b) => ({ b, distance: node.distanceTo(other) }))
      .filter(({ b, distance }) => b !== a && distance <= maxEdgeLength)
      .sort((left, right) => left.distance - right.distance)
      .slice(0, neighbors)
      .forEach(({ b }) => {
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push(a < b ? [a, b] : [b, a]);
      });
  });

  const accents = nodes.map((_, index) => index).filter((index) => index % 6 === 2);

  return { nodes, edges, accents };
}
