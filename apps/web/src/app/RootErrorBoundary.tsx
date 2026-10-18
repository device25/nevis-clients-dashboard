import { ErrorBoundary, ErrorState, Stack } from '@nevis/design-system';
import type { ReactNode } from 'react';

/**
 * The last boundary: anything the dashboard did not handle replaces the whole
 * page (D17). The only way out is to start over.
 */
export function RootErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={() => (
        <Stack as="main" padding="page">
          <ErrorState
            headingLevel={1}
            title="Something went wrong"
            message="The page could not be displayed. Reload to try again."
            actionLabel="Reload"
            onAction={() => {
              location.reload();
            }}
          />
        </Stack>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
