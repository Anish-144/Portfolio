import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError: (error: unknown) => void;
}

interface State {
  failed: boolean;
}

/** Catches renderer creation failures and lazy-chunk load errors from the 3D scene. */
export class WebGLErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    if (import.meta.env.DEV) console.warn('3D scene unavailable, using fallback.', error, info.componentStack);
    this.props.onError(error);
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
