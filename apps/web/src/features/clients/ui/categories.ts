import { MONTHS } from '@nevis/data';
import type { ChartCategory } from '@nevis/design-system';

// "Feb 2024" becomes "Feb" on narrow charts, with the year under the first and
// the last month only (DESIGN.md, narrow screens). The labels are literals in
// the contract, so slicing them cannot go wrong.
export const CATEGORIES: readonly ChartCategory[] = MONTHS.map(
  (month, index) => ({
    label: month.label,
    shortLabel: month.label.slice(0, 3),
    shortCaption:
      index === 0 || index === MONTHS.length - 1
        ? month.label.slice(4)
        : undefined,
  }),
);
