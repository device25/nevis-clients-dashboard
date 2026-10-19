import { Heading, Stack, VisuallyHidden } from '@nevis/design-system';
import { Suspense, useRef, useState } from 'react';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DataBoundary } from './DataBoundary';
import { Dashboard } from './Dashboard';
import { CLIENTS_HEADING_ID } from './ids';

/** The page: the heading, and the dashboard behind its loading and error boundaries. */
export function ClientsPage() {
  const heading = useRef<HTMLHeadingElement>(null);
  const retried = useRef(false);
  const [loading, setLoading] = useState(false);

  // After "Try again" the button that had focus is gone; once the data is
  // there, focus goes back to the top of the page (D16). The first load
  // leaves focus alone.
  function handleLoaded() {
    if (!retried.current) return;
    retried.current = false;
    heading.current?.focus();
  }

  // The same for a widget that was retried on its own (D24).
  function handleWidgetRecovered() {
    heading.current?.focus();
  }

  return (
    <Stack as="main" padding="page" gap={4}>
      <Heading level={1} id={CLIENTS_HEADING_ID} tabIndex={-1} ref={heading}>
        Clients
      </Heading>
      {/* Mounted from the first render and outside the busy region: a live
          region that arrives with its text, or sits inside an element marked
          busy, may not be announced (D24). */}
      <VisuallyHidden role="status">
        {loading ? 'Loading clients' : ''}
      </VisuallyHidden>
      <DataBoundary
        onRetry={() => {
          retried.current = true;
        }}
      >
        <Suspense fallback={<DashboardSkeleton onShownChange={setLoading} />}>
          <Dashboard
            onLoaded={handleLoaded}
            onWidgetRecovered={handleWidgetRecovered}
          />
        </Suspense>
      </DataBoundary>
    </Stack>
  );
}
