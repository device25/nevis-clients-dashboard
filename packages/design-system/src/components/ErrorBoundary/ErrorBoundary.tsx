import { Component, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** What to show instead of the children. `reset` tries the children again. */
  fallback: (error: unknown, reset: () => void) => ReactNode;
  /** Called before the children are tried again, whether by `reset` or by `resetKeys`. */
  onReset?: () => void;
  /** When any of these changes while the fallback is shown, the boundary resets. */
  resetKeys?: readonly unknown[];
}

interface ErrorBoundaryState {
  // The thrown value can be anything, `undefined` included, so a flag tells
  // whether the boundary has caught something.
  failed: boolean;
  error: unknown;
}

function keysChanged(
  previous: readonly unknown[] = [],
  next: readonly unknown[] = [],
): boolean {
  return (
    previous.length !== next.length ||
    previous.some((key, index) => !Object.is(key, next[index]))
  );
}

/**
 * Catches errors thrown while rendering its children. It never logs: the
 * application reports each error once, through React's root error callbacks.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { failed: false, error: undefined };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { failed: true, error };
  }

  override componentDidUpdate(
    previousProps: ErrorBoundaryProps,
    previousState: ErrorBoundaryState,
  ) {
    if (
      this.state.failed &&
      previousState.failed &&
      keysChanged(previousProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  // Arrow function: it is handed to the fallback as a callback.
  reset = () => {
    this.props.onReset?.();
    this.setState({ failed: false, error: undefined });
  };

  override render() {
    return this.state.failed
      ? this.props.fallback(this.state.error, this.reset)
      : this.props.children;
  }
}
