import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import type { HierarchyNode } from '#adapter';
import { clientsQueryOptions } from '#queries';

export type SeededDataProviderProps = {
  children: ReactNode;
} & ({ tree: HierarchyNode; error?: never } | { error: Error; tree?: never });

function seededClient(outcome: { tree?: HierarchyNode; error?: Error }) {
  const client = new QueryClient();
  const { queryKey } = clientsQueryOptions('');
  if (outcome.tree) {
    client.setQueryData(queryKey, outcome.tree);
  } else if (outcome.error) {
    // Put the query in its failed state directly, so the error reaches the
    // boundary on the first render and nothing is requested.
    client.getQueryCache().build(client, { queryKey }).setState({
      status: 'error',
      error: outcome.error,
      errorUpdateCount: 1,
      errorUpdatedAt: Date.now(),
      fetchStatus: 'idle',
    });
    client.setQueryDefaults(queryKey, { retryOnMount: false });
  }
  return client;
}

/** A provider that already holds its outcome. Backs `TestDataProvider`. */
export function SeededDataProvider({
  children,
  ...outcome
}: SeededDataProviderProps) {
  const [client] = useState(() => seededClient(outcome));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
