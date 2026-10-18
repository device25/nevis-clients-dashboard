// Rows-first treegrid keyboard model (ACCESSIBILITY.md "Keyboard", after the
// APG treegrid example): which key does what from a row or from a cell.
import type { GridPosition, VisibleRow } from './tree';

/** Rows moved by PageDown and PageUp. */
export const PAGE_SIZE = 10;

export type GridAction =
  | { type: 'focus'; position: GridPosition }
  | { type: 'expand'; rowId: string }
  | { type: 'collapse'; rowId: string }
  | { type: 'select'; rowId: string };

export interface GridKey {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

/**
 * The action for a key press, or `null` when the grid does not handle the key
 * (the browser then does its default, as for Tab).
 *
 * `lastColumn` is the index of the last cell: cells are numbered from 0 (the
 * row header) to `lastColumn`.
 */
export function keyAction<T>(
  { key, ctrlKey, altKey, metaKey }: GridKey,
  position: GridPosition,
  rows: readonly VisibleRow<T>[],
  lastColumn: number,
): GridAction | null {
  if (altKey || metaKey) return null;
  const index = rows.findIndex((row) => row.id === position.rowId);
  const current = rows[index];
  if (current === undefined) return null;
  const { column } = position;

  const toRow = (target: number): GridAction | null => {
    const clamped = Math.min(rows.length - 1, Math.max(0, target));
    const row = rows[clamped];
    if (row === undefined || clamped === index) return null;
    return { type: 'focus', position: { rowId: row.id, column } };
  };
  const toColumn = (target: number | null): GridAction | null =>
    target === column
      ? null
      : { type: 'focus', position: { rowId: current.id, column: target } };
  const toggle = (): GridAction | null => {
    if (!current.hasChildren) return null;
    return {
      type: current.expanded ? 'collapse' : 'expand',
      rowId: current.id,
    };
  };

  if (ctrlKey) {
    if (key === 'Home') return toRow(0);
    if (key === 'End') return toRow(rows.length - 1);
    return null;
  }

  switch (key) {
    case 'ArrowDown':
      return toRow(index + 1);
    case 'ArrowUp':
      return toRow(index - 1);
    case 'PageDown':
      return toRow(index + PAGE_SIZE);
    case 'PageUp':
      return toRow(index - PAGE_SIZE);
    case 'Home':
      return column === null ? toRow(0) : toColumn(0);
    case 'End':
      return column === null ? toRow(rows.length - 1) : toColumn(lastColumn);
    case 'ArrowRight':
      if (column !== null) return toColumn(Math.min(lastColumn, column + 1));
      if (current.hasChildren && !current.expanded) {
        return { type: 'expand', rowId: current.id };
      }
      return toColumn(0);
    case 'ArrowLeft': {
      if (column !== null) return toColumn(column === 0 ? null : column - 1);
      if (current.hasChildren && current.expanded) {
        return { type: 'collapse', rowId: current.id };
      }
      if (current.parentId === null) return null;
      return {
        type: 'focus',
        position: { rowId: current.parentId, column: null },
      };
    }
    case 'Enter':
      return toggle();
    case ' ':
      return { type: 'select', rowId: current.id };
    default:
      return null;
  }
}

/** Keys the grid owns even when they change nothing, so the page does not scroll. */
export function isGridKey(key: string): boolean {
  return [
    'ArrowDown',
    'ArrowUp',
    'ArrowLeft',
    'ArrowRight',
    'PageDown',
    'PageUp',
    'Home',
    'End',
    'Enter',
    ' ',
  ].includes(key);
}
