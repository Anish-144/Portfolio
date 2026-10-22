import type { CSSProperties } from 'react';
import type { ArchitectureStep } from '../../content/projects';

/** Numbered pipeline: horizontal on wide screens, vertical on narrow ones. */
export function ArchitectureFlow({ steps, label }: { steps: readonly ArchitectureStep[]; label: string }) {
  return (
    <ol className="flow" aria-label={label} style={{ '--steps': steps.length } as CSSProperties}>
      {steps.map((step, index) => (
        <li key={step.label} className="flow__step">
          <span className="flow__index" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="flow__label">{step.label}</span>
          <span className="flow__detail">{step.detail}</span>
        </li>
      ))}
    </ol>
  );
}
