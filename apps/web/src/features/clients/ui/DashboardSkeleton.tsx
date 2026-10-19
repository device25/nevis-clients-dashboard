import { Skeleton, Stack } from '@nevis/design-system';
import { useEffect } from 'react';

interface DashboardSkeletonProps {
  /**
   * Called with `true` when the skeleton appears and `false` when it goes.
   * The page announces the loading in a status of its own (D24).
   */
  onShownChange: (shown: boolean) => void;
}

/** The dashboard's layout without data: the same cards and sizes (D16). */
export function DashboardSkeleton({ onShownChange }: DashboardSkeletonProps) {
  useEffect(() => {
    onShownChange(true);
    return () => {
      onShownChange(false);
    };
  }, [onShownChange]);

  return (
    <Stack gap={4} aria-busy="true">
      <Skeleton variant="chart" />
      <Skeleton variant="table" />
    </Stack>
  );
}
