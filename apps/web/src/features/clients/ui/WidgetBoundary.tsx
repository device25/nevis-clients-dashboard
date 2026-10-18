import { ErrorBoundary, ErrorState } from '@nevis/design-system';
import type { ReactNode } from 'react';

interface WidgetBoundaryProps {
  title: string;
  message: string;
  children: ReactNode;
}

/**
 * Keeps a rendering failure inside one widget (D17). "Try again" mounts the
 * widget anew; what the user chose lives above it, so nothing is lost.
 */
export function WidgetBoundary({
  title,
  message,
  children,
}: WidgetBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(_error, reset) => (
        <ErrorState
          headingLevel={3}
          title={title}
          message={message}
          actionLabel="Try again"
          onAction={reset}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
