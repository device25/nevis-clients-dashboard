import { Skeleton, Stack } from '@nevis/design-system';
import { useEffect } from 'react';
import { SCOPE_NOTE } from '#model';

/** How long the design system's skeleton waits before it fades in (D16). */
const FADE_IN_DELAY_MS = 150;

interface DashboardSkeletonProps {
  /**
   * Called with `true` once the skeleton has been on screen for as long as it
   * takes to fade in, and with `false` when it goes. A response that beats
   * the fade shows no skeleton, so it is not announced either. The page
   * announces the loading in a status of its own (D24).
   */
  onShownChange: (shown: boolean) => void;
}

/** The dashboard's layout without data: the same cards and sizes (D16). */
export function DashboardSkeleton({ onShownChange }: DashboardSkeletonProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onShownChange(true);
    }, FADE_IN_DELAY_MS);
    return () => {
      clearTimeout(timer);
      onShownChange(false);
    };
  }, [onShownChange]);

  return (
    <Stack gap={4} aria-busy="true">
      {/* The page opens at Company scope, which shows the note under the
          legend; reserving its height keeps the table from moving (D16). */}
      <Skeleton variant="chart" footnote={SCOPE_NOTE} />
      <Skeleton variant="table" />
    </Stack>
  );
}
