import './BreakdownCallout.css';

/**
 * Teardown annotation drawn over the 3D layer: a graduated dimension ring
 * around the featured component. Position, size and opacity come from CSS
 * custom properties the camera rig writes each frame, so this never
 * re-renders while scrolling. Decorative.
 */
export function BreakdownCallout() {
  return (
    <div className="breakdown" aria-hidden="true">
      <span className="breakdown__ring" />
    </div>
  );
}
