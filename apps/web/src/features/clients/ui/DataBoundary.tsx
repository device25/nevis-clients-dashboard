import { DataError, DataResetBoundary } from '@nevis/data';
import { ErrorBoundary, ErrorState } from '@nevis/design-system';
import { useEffect, useState, type ReactNode } from 'react';
import { DashboardSkeleton } from './DashboardSkeleton';
import { dataErrorMessage } from './messages';

/** How often a cancelled request is retried before the user is told. */
const MAX_SILENT_RETRIES = 3;

interface DataBoundaryProps {
  children: ReactNode;
  /** The user asked to try again (not called for silent retries). */
  onRetry: () => void;
}

function SilentRetry({ retry }: { retry: () => void }) {
  useEffect(() => {
    retry();
  }, [retry]);
  return <DashboardSkeleton />;
}

/**
 * Replaces the dashboard when the request or its validation fails (D17).
 * Only a `DataError` is shown here; anything else is a bug and goes on to
 * the root boundary.
 */
export function DataBoundary({ children, onRetry }: DataBoundaryProps) {
  const [silentRetries, setSilentRetries] = useState(0);

  return (
    <DataResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={(error, resetBoundary) => {
            if (!(error instanceof DataError)) {
              throw error;
            }
            if (
              error.kind === 'aborted' &&
              silentRetries < MAX_SILENT_RETRIES
            ) {
              return (
                <SilentRetry
                  retry={() => {
                    setSilentRetries(silentRetries + 1);
                    resetBoundary();
                  }}
                />
              );
            }
            return (
              <ErrorState
                title="Clients could not be loaded"
                message={dataErrorMessage(error.kind)}
                actionLabel="Try again"
                onAction={() => {
                  setSilentRetries(0);
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
