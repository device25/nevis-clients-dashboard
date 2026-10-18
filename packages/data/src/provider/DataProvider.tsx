import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { BaseUrlContext } from '#queries';

export interface DataProviderProps {
  /** Origin of the API. Empty means the page's own origin. */
  baseUrl?: string;
  children: ReactNode;
}

/** Owns the cache for the subtree; mount it once, above everything that reads data. */
export function DataProvider({ baseUrl = '', children }: DataProviderProps) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <BaseUrlContext value={baseUrl}>{children}</BaseUrlContext>
    </QueryClientProvider>
  );
}
