// Literals, not Date parsing: the labels must not depend on locale or timezone.
export const MONTHS = [
  { key: '2024-02', label: 'Feb 2024' },
  { key: '2024-03', label: 'Mar 2024' },
  { key: '2024-04', label: 'Apr 2024' },
  { key: '2024-05', label: 'May 2024' },
  { key: '2024-06', label: 'Jun 2024' },
  { key: '2024-07', label: 'Jul 2024' },
  { key: '2024-08', label: 'Aug 2024' },
  { key: '2024-09', label: 'Sep 2024' },
  { key: '2024-10', label: 'Oct 2024' },
  { key: '2024-11', label: 'Nov 2024' },
  { key: '2024-12', label: 'Dec 2024' },
  { key: '2025-01', label: 'Jan 2025' },
] as const;

export type Month = (typeof MONTHS)[number];
