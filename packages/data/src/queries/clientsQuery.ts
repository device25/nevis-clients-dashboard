import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import { toHierarchy, type HierarchyNode } from '#adapter';
import { fetchClients } from '#transport';

/**
 * The origin requests go to. Lives here, below the provider, because the hook
 * needs it and layers may not import upward.
 */
export const BaseUrlContext = createContext('');

export function clientsQueryOptions(baseUrl: string) {
  return queryOptions({
    queryKey: ['clients', baseUrl],
    // The query's own signal cancels the request when nobody observes it.
    queryFn: async ({ signal }) =>
      toHierarchy(await fetchClients(signal, baseUrl)),
    // Retrying is the user's decision, through DataResetBoundary.
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

/** Suspends until the tree has loaded; throws a `DataError` if it cannot. */
export function useClientsTree(): HierarchyNode {
  const baseUrl = useContext(BaseUrlContext);
  return useSuspenseQuery(clientsQueryOptions(baseUrl)).data;
}
