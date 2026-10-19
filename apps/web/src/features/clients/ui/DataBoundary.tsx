import { DataError, DataResetBoundary } from '@nevis/data';
import { ErrorBoundary, ErrorState } from '@nevis/design-system';
import type { ReactNode } from 'react';
import { dataErrorMessage } from './messages';

interface DataBoundaryProps {
  children: ReactNode;
  /** The user asked to try again. */
  onRetry: () => void;
}

/**
 * Replaces the dashboard when the request or its validation fails (D17).
 * Only a `DataError` is shown here; anything else is a bug and goes on to
 * the root boundary. A cancelled request shows nothing (D24).
 */
export function DataBoundary({ children, onRetry }: DataBoundaryProps) {
  return (
    <DataResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={(error, resetBoundary) => {
            if (!(error instanceof DataError)) {
              throw error;
            }
            if (error.kind === 'aborted') {
              return null;
            }
            return (
              <ErrorState
                title="Clients could not be loaded"
                message={dataErrorMessage(error.kind)}
                actionLabel="Try again"
                onAction={() => {
                  onRetry();
                  resetBoundary();
                }}
              />
            );
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </DataResetBoundary>
  );
}
