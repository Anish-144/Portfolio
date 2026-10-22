import {
  Color,
  LineBasicMaterial,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from 'three';
import type { QualityTier } from './quality';

export const AMBER = '#ffa53d';
const AMBER_OFF = '#24170b';

export interface SculptureMaterials {
  chrome: MeshStandardMaterial;
  steel: MeshStandardMaterial;
  gunmetal: MeshStandardMaterial;
  blackened: MeshStandardMaterial;
  obsidian: MeshStandardMaterial;
  node: MeshStandardMaterial;
  amber: MeshBasicMaterial;
  line: LineBasicMaterial;
  /** Drives the amber "power-on" (0 = dark, 1 = lit). */
  setPower: (power: number) => void;
  dispose: () => void;
}

interface MetalOptions {
  anisotropy?: number;
}

/**
 * Physical materials (anisotropic brushed steel, clear-coated core) on capable
 * devices; plain PBR on the low tier. Same palette either way.
 */
export function createSculptureMaterials(tier: QualityTier): SculptureMaterials {
  const physical = tier === 'high';

  const metal = (color: string, roughness: number, options: MetalOptions = {}): MeshStandardMaterial => {
    if (!physical) return new MeshStandardMaterial({ color, metalness: 1, roughness });
    const material = new MeshPhysicalMaterial({ color, metalness: 1, roughness });
    if (options.anisotropy) material.anisotropy = options.anisotropy;
    return material;
  };

  const chrome = metal('#e3e5e9', 0.14);
  const steel = metal('#b2b7be', 0.3, { anisotropy: 0.6 });
  const gunmetal = metal('#4a4e55', 0.3);
  const blackened = metal('#1c1e22', 0.4);
  const node = metal('#eceef1', 0.22);

  const obsidian = physical
    ? new MeshPhysicalMaterial({
        color: '#050506',
        metalness: 0.35,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      })
    : new MeshStandardMaterial({ color: '#050506', metalness: 0.5, roughness: 0.16 });

  const amber = new MeshBasicMaterial({ color: AMBER_OFF, toneMapped: false });
  const line = new LineBasicMaterial({ color: '#c6cbd3', transparent: true, opacity: 0, depthWrite: false });

  const on = new Color(AMBER);
  const off = new Color(AMBER_OFF);
  const all = [chrome, steel, gunmetal, blackened, node, obsidian, amber, line];

  return {
    chrome,
    steel,
    gunmetal,
    blackened,
    obsidian,
    node,
    amber,
    line,
    setPower: (power) => {
      amber.color.copy(off).lerp(on, power);
    },
    dispose: () => all.forEach((material) => material.dispose()),
  };
}
