import { QueryErrorResetBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export interface DataResetBoundaryProps {
  /**
   * Render the error boundary here and call `reset` from its own reset
   * handler: the next render of a failed read then requests the data again.
   */
  children: (controls: { reset: () => void }) => ReactNode;
}

export function DataResetBoundary({ children }: DataResetBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => children({ reset })}
    </QueryErrorResetBoundary>
  );
}
