export { CHART, NARROW_CHART_WIDTH } from './geometry';

export const GAPS = [1, 2, 3, 4, 5, 6] as const;
export type Gap = (typeof GAPS)[number];

const CHART_COLOR_COUNT = 5;
const AVATAR_COLOR_COUNT = 4;

/** Series colour by zero-based index; wraps after the fifth. */
export function chartColor(index: number): string {
  const slot =
    ((Math.trunc(index) % CHART_COLOR_COUNT) + CHART_COLOR_COUNT) %
    CHART_COLOR_COUNT;
  return `var(--color-chart-${String(slot + 1)})`;
}

/** Avatar background chosen from an id; the same id always gives the same colour. */
export function avatarColor(id: string): string {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 2_147_483_647;
  }
  return `var(--color-avatar-${String((hash % AVATAR_COLOR_COUNT) + 1)})`;
}

/** Joins class names, skipping the `undefined` that module lookups can return. */
export function cx(...names: readonly (string | false | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
