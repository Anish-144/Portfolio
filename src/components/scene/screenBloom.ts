import {
  AddEquation,
  CustomBlending,
  FramebufferTexture,
  NoBlending,
  OneFactor,
  RawShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type Texture,
  type TextureDataType,
  type WebGLRenderer,
} from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

/** Blur chain depth: level 0 is half the canvas, each further level half again. */
const LEVELS = 5;

/**
 * What spills into the glow, in display values. Saturated pixels (the lit
 * amber) bloom from a low threshold at full gain; neutral ones (the metal)
 * only near white and at reduced gain, so bright faces don't haze over.
 */
const PICK = { warmThreshold: 0.2, neutralThreshold: 0.86, neutralGain: 0.3 } as const;

const VERTEX = /* glsl */ `
  precision highp float;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  attribute vec3 position;
  attribute vec2 uv;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Canvas → level 0: thresholds each of the 2×2 source texels, then averages them. */
const BRIGHT = /* glsl */ `
  precision highp float;
  uniform sampler2D tSource;
  uniform vec2 uTexel;
  varying vec2 vUv;

  vec3 pick(vec2 uv) {
    vec3 color = texture2D(tSource, uv).rgb;
    float peak = max(color.r, max(color.g, color.b));
    float low = min(color.r, min(color.g, color.b));
    float warm = smoothstep(0.35, 0.7, peak > 0.0 ? (peak - low) / peak : 0.0);
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float threshold = mix(${PICK.neutralThreshold.toFixed(2)}, ${PICK.warmThreshold.toFixed(2)}, warm);
    float gain = mix(${PICK.neutralGain.toFixed(2)}, 1.0, warm);
    return color * gain * max(luma - threshold, 0.0) / max(luma, 1e-4);
  }

  void main() {
    vec2 o = uTexel * 0.5;
    vec3 sum = pick(vUv + vec2(-o.x, -o.y)) + pick(vUv + vec2(o.x, -o.y)) + pick(vUv + vec2(-o.x, o.y)) + pick(vUv + o);
    gl_FragColor = vec4(sum * 0.25, 1.0);
  }
`;

/** Dual-filter downsample: center plus four diagonal bilinear taps. */
const DOWN = /* glsl */ `
  precision highp float;
  uniform sampler2D tSource;
  uniform vec2 uTexel;
  varying vec2 vUv;

  void main() {
    vec2 o = uTexel;
    vec3 sum = texture2D(tSource, vUv).rgb * 4.0;
    sum += texture2D(tSource, vUv + vec2(-o.x, -o.y)).rgb;
    sum += texture2D(tSource, vUv + vec2(o.x, -o.y)).rgb;
    sum += texture2D(tSource, vUv + vec2(-o.x, o.y)).rgb;
    sum += texture2D(tSource, vUv + o).rgb;
    gl_FragColor = vec4(sum / 8.0, 1.0);
  }
`;

/** Dual-filter upsample (tent), added onto the next larger level. */
const UP = /* glsl */ `
  precision highp float;
  uniform sampler2D tSource;
  uniform vec2 uTexel;
  varying vec2 vUv;

  void main() {
    vec2 o = uTexel;
    vec3 sum = texture2D(tSource, vUv + vec2(-2.0 * o.x, 0.0)).rgb;
    sum += texture2D(tSource, vUv + vec2(2.0 * o.x, 0.0)).rgb;
    sum += texture2D(tSource, vUv + vec2(0.0, -2.0 * o.y)).rgb;
    sum += texture2D(tSource, vUv + vec2(0.0, 2.0 * o.y)).rgb;
    sum += texture2D(tSource, vUv + vec2(-o.x, -o.y)).rgb * 2.0;
    sum += texture2D(tSource, vUv + vec2(o.x, -o.y)).rgb * 2.0;
    sum += texture2D(tSource, vUv + vec2(-o.x, o.y)).rgb * 2.0;
    sum += texture2D(tSource, vUv + o).rgb * 2.0;
    gl_FragColor = vec4(sum / 12.0, 1.0);
  }
`;

/**
 * Level 0 → canvas, premultiplied and additive; saturates softly along the
 * glow's own hue. The glow fades over pixels that are already bright, so it
 * haloes the amber without clipping the amber itself toward yellow. Empty
 * pixels are skipped: on a multisampled canvas every write is expensive.
 */
const COMPOSITE = /* glsl */ `
  precision highp float;
  uniform sampler2D tSource;
  uniform sampler2D tFrame;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    vec3 glow = texture2D(tSource, vUv).rgb * uStrength;
    float peak = max(glow.r, max(glow.g, glow.b));
    if (peak < 0.002) discard;
    glow *= (1.0 - exp(-peak)) / peak;
    vec3 under = texture2D(tFrame, vUv).rgb;
    glow *= 1.0 - 0.8 * max(under.r, max(under.g, under.b));
    gl_FragColor = vec4(glow, max(glow.r, max(glow.g, glow.b)));
  }
`;

// A type alias (not an interface) so it satisfies three's uniform index signature.
type PassUniforms = {
  tSource: { value: Texture | null };
  tFrame: { value: Texture | null };
  uTexel: { value: Vector2 };
  uStrength: { value: number };
};

/** Premultiplied additive: adds onto what the target already holds. */
const ADDITIVE = { blending: CustomBlending, blendEquation: AddEquation, blendSrc: OneFactor, blendDst: OneFactor } as const;

function createPass(fragmentShader: string, additive = false) {
  const uniforms: PassUniforms = {
    tSource: { value: null },
    tFrame: { value: null },
    uTexel: { value: new Vector2() },
    uStrength: { value: 1 },
  };
  const material = new RawShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    ...(additive ? ADDITIVE : { blending: NoBlending }),
  });
  return { material, uniforms };
}

type BloomPass = ReturnType<typeof createPass>;

/**
 * Glow built from the finished frame. The scene renders straight to the
 * multisampled canvas as usual; this copies that frame, picks out what should
 * glow, blurs it through a short down/up chain at reduced resolution, and adds
 * it back over the canvas. Far cheaper than rendering the scene into a
 * multisampled float target, and the sculpture itself is left untouched.
 */
export class ScreenBloom {
  private frame = new FramebufferTexture(1, 1);
  private readonly frameSize = new Vector2(1, 1);
  private readonly levels: WebGLRenderTarget[];
  private readonly quad = new FullScreenQuad();
  private readonly bright = createPass(BRIGHT);
  private readonly down = createPass(DOWN);
  private readonly up = createPass(UP, true);
  private readonly composite = createPass(COMPOSITE, true);

  /** `type`: half-float where renderable, so the stacked levels don't clip. */
  constructor(type: TextureDataType) {
    this.levels = Array.from({ length: LEVELS }, () => new WebGLRenderTarget(1, 1, { type, depthBuffer: false }));
  }

  /** Drawing-buffer size of the canvas, in device pixels. */
  setSize(width: number, height: number): void {
    this.frame.dispose();
    this.frame = new FramebufferTexture(width, height);
    this.frameSize.set(width, height);
    let w = width;
    let h = height;
    for (const level of this.levels) {
      w = Math.max(1, Math.round(w / 2));
      h = Math.max(1, Math.round(h / 2));
      level.setSize(w, h);
    }
  }

  /** Call right after the scene has rendered to the canvas. */
  render(renderer: WebGLRenderer, strength: number): void {
    const first = this.levels[0];
    if (strength <= 0 || !first) return;
    renderer.copyFramebufferToTexture(this.frame);
    // Up passes add onto their targets, so nothing may be cleared in between.
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;

    this.draw(renderer, this.bright, this.frame, this.frameSize.x, this.frameSize.y, first);
    for (let index = 1; index < this.levels.length; index++) {
      const source = this.levels[index - 1];
      const target = this.levels[index];
      if (source && target) this.draw(renderer, this.down, source.texture, source.width, source.height, target);
    }
    for (let index = this.levels.length - 2; index >= 0; index--) {
      const source = this.levels[index + 1];
      const target = this.levels[index];
      if (source && target) this.draw(renderer, this.up, source.texture, source.width, source.height, target);
    }
    this.composite.uniforms.uStrength.value = strength;
    this.composite.uniforms.tFrame.value = this.frame;
    this.draw(renderer, this.composite, first.texture, first.width, first.height, null);

    renderer.autoClear = autoClear;
  }

  dispose(): void {
    this.frame.dispose();
    this.levels.forEach((level) => level.dispose());
    [this.bright, this.down, this.up, this.composite].forEach((pass) => pass.material.dispose());
    this.quad.dispose();
  }

  private draw(
    renderer: WebGLRenderer,
    pass: BloomPass,
    source: Texture,
    width: number,
    height: number,
    target: WebGLRenderTarget | null,
  ): void {
    pass.uniforms.tSource.value = source;
    pass.uniforms.uTexel.value.set(1 / width, 1 / height);
    this.quad.material = pass.material;
    renderer.setRenderTarget(target);
    this.quad.render(renderer);
  }
}
