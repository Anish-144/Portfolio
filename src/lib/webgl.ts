/**
 * three.js (r163+) renders with WebGL 2 only, so that is what we probe for.
 * Append `?nowebgl` to the URL to preview the CSS fallback.
 */
export function canRenderWebGL(): boolean {
  if (new URLSearchParams(window.location.search).has('nowebgl')) return false;

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
