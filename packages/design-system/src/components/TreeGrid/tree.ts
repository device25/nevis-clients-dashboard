// Pure tree helpers for TreeGrid: which rows are visible, and where focus may go.

export interface TreeAccess<T> {
  getId: (node: T) => string;
  getChildren: (node: T) => readonly T[];
}

export interface VisibleRow<T> {
  node: T;
  id: string;
  /** 1 for the root. */
  level: number;
  setSize: number;
  /** 1-based. */
  posInSet: number;
  parentId: string | null;
  hasChildren: boolean;
  /** Meaningful only when `hasChildren`. */
  expanded: boolean;
}

/** The rows a reader sees, in order: a row's children only when it is expanded. */
export function visibleRows<T>(
  root: T,
  { getId, getChildren }: TreeAccess<T>,
  expandedIds: ReadonlySet<string>,
): VisibleRow<T>[] {
  const rows: VisibleRow<T>[] = [];
  const visit = (
    node: T,
    level: number,
    setSize: number,
    posInSet: number,
    parentId: string | null,
  ) => {
    const id = getId(node);
    const children = getChildren(node);
    const hasChildren = children.length > 0;
    const expanded = hasChildren && expandedIds.has(id);
    rows.push({
      node,
      id,
      level,
      setSize,
      posInSet,
      parentId,
      hasChildren,
      expanded,
    });
    if (!expanded) return;
    children.forEach((child, index) => {
      visit(child, level + 1, children.length, index + 1, id);
    });
  };
  visit(root, 1, 1, 1, null);
  return rows;
}

/** Parent id of every node in the tree, visible or not; `null` for the root. */
export function parentIds<T>(
  root: T,
  { getId, getChildren }: TreeAccess<T>,
): Map<string, string | null> {
  const parents = new Map<string, string | null>();
  const visit = (node: T, parentId: string | null) => {
    const id = getId(node);
    parents.set(id, parentId);
    for (const child of getChildren(node)) visit(child, id);
  };
  visit(root, null);
  return parents;
}

/** The focusable element of the grid: a row (`column` null) or one of its cells. */
export interface GridPosition {
  rowId: string;
  /** 0 is the row header, 1 onwards the value cells; `null` is the row itself. */
  column: number | null;
}

export function samePosition(a: GridPosition, b: GridPosition): boolean {
  return a.rowId === b.rowId && a.column === b.column;
}

/**
 * Where the roving tab stop belongs. A position on a hidden row moves to the
 * nearest visible ancestor row, which is the row whose collapse hid it; a
 * position on a node that no longer exists moves to the first row.
 */
export function resolvePosition<T>(
  position: GridPosition,
  rows: readonly VisibleRow<T>[],
  parents: ReadonlyMap<string, string | null>,
  columnCount: number,
): GridPosition {
  const visible = new Set(rows.map((row) => row.id));
  if (visible.has(position.rowId)) {
    if (position.column === null || position.column <= columnCount) {
      return position;
    }
    return { rowId: position.rowId, column: columnCount };
  }
  let ancestor = parents.get(position.rowId);
  while (ancestor !== undefined && ancestor !== null) {
    if (visible.has(ancestor)) return { rowId: ancestor, column: null };
    ancestor = parents.get(ancestor);
  }
  const first = rows[0];
  return {
    rowId: first === undefined ? position.rowId : first.id,
    column: null,
  };
}
