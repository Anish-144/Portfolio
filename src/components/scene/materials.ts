import {
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  LineBasicMaterial,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
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
  /** Apply the turned-metal grain (roughness varies in fine bands). */
  grain?: boolean;
}

/**
 * Turned-metal grain: a column of fine, random roughness bands. Lathe parts
 * run their v coordinate along the profile, so the bands land as concentric
 * rings on faces and as tool marks on walls, the way machined stock looks.
 */
function createGrainTexture(): DataTexture {
  const height = 256;
  const width = 4;
  const data = new Uint8Array(width * height * 4);
  let seed = 9277;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let y = 0; y < height; y++) {
    // Mostly mid values with occasional brighter "cut" lines.
    const value = Math.round(255 * (0.62 + random() * 0.26 + (random() > 0.9 ? 0.12 : 0)));
    for (let x = 0; x < width; x++) {
      data.set([value, value, value, 255], (y * width + x) * 4);
    }
  }
  const texture = new DataTexture(data, width, height);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 6);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Physical materials (anisotropic brushed steel, clear-coated core) on capable
 * devices; plain PBR on the low tier. Same palette either way.
 */
export function createSculptureMaterials(tier: QualityTier): SculptureMaterials {
  const physical = tier === 'high';
  const grain = createGrainTexture();

  const metal = (color: string, roughness: number, options: MetalOptions = {}): MeshStandardMaterial => {
    const material = physical
      ? new MeshPhysicalMaterial({ color, metalness: 1, roughness })
      : new MeshStandardMaterial({ color, metalness: 1, roughness });
    if (options.grain) material.roughnessMap = grain;
    if (physical && options.anisotropy) (material as MeshPhysicalMaterial).anisotropy = options.anisotropy;
    return material;
  };

  // Grained materials start rougher: the map scales roughness down to ~0.6–1.0 of it.
  const chrome = metal('#e3e5e9', 0.18, { grain: true });
  const steel = metal('#b2b7be', 0.38, { anisotropy: 0.6, grain: true });
  const gunmetal = metal('#4a4e55', 0.37, { grain: true });
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
    dispose: () => {
      all.forEach((material) => material.dispose());
      grain.dispose();
    },
  };
}
