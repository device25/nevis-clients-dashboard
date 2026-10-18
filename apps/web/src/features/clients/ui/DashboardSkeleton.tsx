import { Skeleton, Stack, VisuallyHidden } from '@nevis/design-system';

/** The dashboard's layout without data: the same cards and sizes (D16). */
export function DashboardSkeleton() {
  return (
    <Stack gap={4} aria-busy="true">
      <VisuallyHidden role="status">Loading clients</VisuallyHidden>
      <Skeleton variant="chart" />
      <Skeleton variant="table" />
    </Stack>
  );
}
