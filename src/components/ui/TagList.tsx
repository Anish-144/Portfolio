import './TagList.css';

interface TagListProps {
  items: readonly string[];
  label: string;
  size?: 'sm' | 'md';
}

/** Compact technology/keyword chips. */
export function TagList({ items, label, size = 'md' }: TagListProps) {
  return (
    <ul className={`tags tags--${size}`} aria-label={label}>
      {items.map((item) => (
        <li key={item} className="tags__item">
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Development-only reminder for content that still needs confirmation.
 * Renders nothing in production builds.
 */
export function PendingNote({ children }: { children: string }) {
  if (!import.meta.env.DEV) return null;
  return (
    <span className="pending-note" role="note">
      {children}
    </span>
  );
}
