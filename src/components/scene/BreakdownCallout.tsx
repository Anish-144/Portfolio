import { BREAKDOWN } from '../../content/breakdown';
import './BreakdownCallout.css';

/**
 * Teardown annotation drawn over the 3D layer: a graduated dimension ring
 * around the featured component and a leader to its label. Position, size,
 * opacity, direction and the visible label all come from CSS custom
 * properties and data attributes the camera rig writes each frame, so this
 * never re-renders while scrolling. Decorative: the section text carries the
 * information.
 */
export function BreakdownCallout() {
  return (
    <div className="breakdown" aria-hidden="true">
      <span className="breakdown__ring" />
      <div className="breakdown__anchor">
        <span className="breakdown__dot" />
        <svg className="breakdown__leader breakdown__leader--diagonal" viewBox="0 0 72 32" width="72" height="32">
          <path d="M0 32 L30 2 H72" pathLength={1} />
        </svg>
        <svg className="breakdown__leader breakdown__leader--flat" viewBox="0 0 72 32" width="72" height="32">
          <path d="M0 32 H72" pathLength={1} />
        </svg>
        <div className="breakdown__label">
          {BREAKDOWN.map((label) => (
            <div key={label.section} className="breakdown__item" data-for={label.section}>
              <span className="breakdown__part">{label.part}</span>
              <span className="breakdown__name">{label.name}</span>
              <span className="breakdown__spec">{label.spec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
