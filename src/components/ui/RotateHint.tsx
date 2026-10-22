import './RotateHint.css';

/** Small affordance on an interactive 3D stage; it retires after the first rotation. */
export function RotateHint() {
  return (
    <span className="rotate-hint" aria-hidden="true">
      <svg className="rotate-hint__icon" viewBox="0 0 16 16" width="14" height="14" focusable="false">
        <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v2.8h-2.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span className="rotate-hint__fine">Drag to rotate · 360°</span>
      <span className="rotate-hint__coarse">Swipe to rotate</span>
    </span>
  );
}

/** Props that turn a layout stage into an accessible, focusable rotation surface. */
export function rotateStageProps(interactive: boolean, name: string) {
  return interactive
    ? {
        tabIndex: 0,
        role: 'group' as const,
        'aria-roledescription': '3D model',
        'aria-label': `${name}, an interactive 3D sculpture. Drag, or use the arrow keys, to rotate it.`,
      }
    : { 'aria-hidden': true as const };
}
