import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { cx } from '#tokens';
import { Chevron, VisuallyHidden } from '#primitives';
import { isGridKey, keyAction } from './keyboard';
import {
  parentIds,
  resolvePosition,
  samePosition,
  visibleRows,
  type GridPosition,
  type VisibleRow,
} from './tree';
import styles from './TreeGrid.module.scss';

export interface TreeGridColumn {
  /** Stable key of the column. */
  id: string;
  /** Content of the column header. Headers and cells are aligned to the end. */
  header: ReactNode;
}

/** What `renderRowHeader` may need to know about the row it draws. */
export interface TreeGridRowState {
  /** 1 for the root. */
  level: number;
  /** `undefined` on rows without children. */
  expanded: boolean | undefined;
  selected: boolean;
}

export interface TreeGridProps<T> {
  /** The top node; it is the first row, at level 1. */
  root: T;
  /** Unique, stable id of a node. Used for expansion and selection. */
  getId: (node: T) => string;
  /** Children in display order; an empty list makes the row a leaf. */
  getChildren: (node: T) => readonly T[];
  /** Plain-text name of the row: its accessible name. */
  getLabel: (node: T) => string;
  /**
   * Name of the row header column. The header is visually empty, as in the
   * design; the name is visually hidden text for assistive technology.
   */
  nameColumnLabel: string;
  /** The value columns, after the row header column. */
  columns: readonly TreeGridColumn[];
  /**
   * Content of the row header after the indent and the chevron, laid out in a
   * row with an 8px gap. Defaults to the label.
   */
  renderRowHeader?: (node: T, row: TreeGridRowState) => ReactNode;
  /** Content of a value cell. */
  renderCell: (
    node: T,
    column: TreeGridColumn,
    columnIndex: number,
  ) => ReactNode;
  /**
   * Optional accessible description of a value cell. Rendered as hidden text
   * and referenced by the cell's `aria-describedby`; not part of its name.
   */
  describeCell?: (
    node: T,
    column: TreeGridColumn,
    columnIndex: number,
  ) => string | undefined;
  /** Id of the visible element that names the grid. */
  labelledBy: string;
  /** Ids of expanded rows. Ids of hidden or leaf rows may be present. */
  expandedIds: ReadonlySet<string>;
  /** Called with the complete new set when the user expands or collapses a row. */
  onExpandedChange: (expandedIds: ReadonlySet<string>) => void;
  /** The single selected row, or `null`. */
  selectedId: string | null;
  /** Called when the user selects a row (click, or Space). */
  onSelect: (id: string) => void;
}

function initialPosition<T>(
  rows: readonly VisibleRow<T>[],
  selectedId: string | null,
): GridPosition {
  const selected = rows.find((row) => row.id === selectedId);
  const first = selected ?? rows[0];
  return { rowId: first === undefined ? '' : first.id, column: null };
}

/**
 * A tree of rows with value columns, following the WAI-ARIA treegrid pattern
 * with rows-first navigation. Single-select; selection and expansion are
 * independent of each other and owned by the caller.
 */
export function TreeGrid<T>({
  root,
  getId,
  getChildren,
  getLabel,
  columns,
  nameColumnLabel,
  renderRowHeader,
  renderCell,
  describeCell,
  labelledBy,
  expandedIds,
  onExpandedChange,
  selectedId,
  onSelect,
}: TreeGridProps<T>) {
  const access = { getId, getChildren };
  const rows = visibleRows(root, access, expandedIds);
  const descriptionPrefix = useId();

  const [storedPosition, setStoredPosition] = useState(() =>
    initialPosition(rows, selectedId),
  );
  const position = resolvePosition(
    storedPosition,
    rows,
    parentIds(root, access),
    columns.length,
  );
  // The stored position may point at a row that a collapse just hid; keep the
  // corrected one so that re-expanding does not move the tab stop back.
  if (!samePosition(position, storedPosition)) setStoredPosition(position);

  const tabIndex = (rowId: string, column: number | null) =>
    position.rowId === rowId && position.column === column ? 0 : -1;

  const rowElements = useRef(new Map<string, HTMLTableRowElement>());
  // The grid element that last received focus, until focus leaves the grid.
  const lastFocused = useRef<Element | null>(null);

  function elementAt({ rowId, column }: GridPosition): HTMLElement | null {
    const rowElement = rowElements.current.get(rowId);
    if (rowElement === undefined) return null;
    return column === null ? rowElement : rowElement.cells.item(column);
  }

  function positionOf(target: EventTarget): GridPosition | null {
    const isCell = target instanceof HTMLTableCellElement;
    const rowElement = isCell ? target.parentElement : target;
    for (const [rowId, element] of rowElements.current) {
      if (element === rowElement) {
        return { rowId, column: isCell ? target.cellIndex : null };
      }
    }
    return null;
  }

  function moveFocus(target: GridPosition) {
    const element = elementAt(target);
    if (element === null) return;
    // The scroll is explicit so that it stays minimal ('nearest') and honours
    // the container's scroll padding under the sticky column.
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function setExpanded(rowId: string, expanded: boolean) {
    const next = new Set(expandedIds);
    if (expanded) next.add(rowId);
    else next.delete(rowId);
    onExpandedChange(next);
  }

  // When a collapse removes the focused row or cell, the browser drops focus
  // to the body; give it to the row that took the tab stop (the collapsed
  // ancestor). Runs after every commit because the collapse may come from
  // outside the grid, through `expandedIds`.
  useEffect(() => {
    const last = lastFocused.current;
    if (last === null || last.isConnected) return;
    lastFocused.current = null;
    const active = document.activeElement;
    if (active !== null && active !== document.body) return;
    moveFocus(position);
  });

  function handleFocus(event: FocusEvent<HTMLTableElement>) {
    lastFocused.current = event.target;
    const focused = positionOf(event.target);
    if (focused !== null && !samePosition(focused, storedPosition)) {
      setStoredPosition(focused);
    }
  }

  function handleBlur(event: FocusEvent<HTMLTableElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    const left = event.target;
    // Some browsers fire blur while removing the focused element. Only a blur
    // that leaves a connected element behind means the user moved focus away.
    queueMicrotask(() => {
      if (left.isConnected && lastFocused.current === left) {
        lastFocused.current = null;
      }
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const { key, ctrlKey, altKey, metaKey } = event;
    const from = positionOf(event.target) ?? position;
    const action = keyAction(
      { key, ctrlKey, altKey, metaKey },
      from,
      rows,
      columns.length,
    );
    const owned =
      !altKey &&
      !metaKey &&
      (ctrlKey ? key === 'Home' || key === 'End' : isGridKey(key));
    if (owned) event.preventDefault();
    if (action === null) return;
    switch (action.type) {
      case 'focus':
        moveFocus(action.position);
        break;
      case 'expand':
        setExpanded(action.rowId, true);
        break;
      case 'collapse':
        setExpanded(action.rowId, false);
        break;
      case 'select':
        onSelect(action.rowId);
        break;
    }
  }

  function handleRowClick(
    event: MouseEvent<HTMLTableRowElement>,
    row: VisibleRow<T>,
  ) {
    const onToggle =
      event.target instanceof Element &&
      event.target.closest('[data-treegrid-toggle]') !== null;
    if (onToggle && row.hasChildren) setExpanded(row.id, !row.expanded);
    else onSelect(row.id);
    event.currentTarget.focus({ preventScroll: true });
  }

  return (
    <div className={styles.scroller}>
      <table
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- a native table with the treegrid role is the markup of ACCESSIBILITY.md and of the APG treegrid example
        role="treegrid"
        aria-labelledby={labelledBy}
        // Without it browsers expose every gridcell as editable, and some
        // screen readers announce them so; the grid has no editing.
        aria-readonly="true"
        className={styles.table}
        style={{ '--treegrid-columns': columns.length } as CSSProperties}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <colgroup>
          <col />
          {columns.map((column) => (
            <col key={column.id} className={styles.valueColumn} />
          ))}
        </colgroup>
        <thead>
          <tr role="row" className={styles.headerRow}>
            <th
              role="columnheader"
              scope="col"
              className={cx(styles.cell, styles.corner)}
            >
              <VisuallyHidden>{nameColumnLabel}</VisuallyHidden>
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                role="columnheader"
                scope="col"
                className={cx(styles.cell, styles.columnHeader)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const selected = row.id === selectedId;
            const rowState: TreeGridRowState = {
              level: row.level,
              expanded: row.hasChildren ? row.expanded : undefined,
              selected,
            };
            return (
              <tr
                key={row.id}
                role="row"
                aria-label={getLabel(row.node)}
                aria-level={row.level}
                aria-setsize={row.setSize}
                aria-posinset={row.posInSet}
                aria-expanded={row.hasChildren ? row.expanded : undefined}
                aria-selected={selected}
                tabIndex={tabIndex(row.id, null)}
                className={styles.row}
                ref={(element) => {
                  if (element === null) return;
                  rowElements.current.set(row.id, element);
                  return () => {
                    rowElements.current.delete(row.id);
                  };
                }}
                onClick={(event) => {
                  handleRowClick(event, row);
                }}
              >
                <th
                  role="rowheader"
                  scope="row"
                  tabIndex={tabIndex(row.id, 0)}
                  className={cx(styles.cell, styles.rowHeader)}
                >
                  <div
                    className={styles.name}
                    style={
                      { '--treegrid-depth': row.level - 1 } as CSSProperties
                    }
                  >
                    {row.hasChildren ? (
                      <span
                        className={cx(styles.slot, styles.toggle)}
                        data-treegrid-toggle=""
                      >
                        <Chevron expanded={row.expanded} />
                      </span>
                    ) : (
                      <span className={styles.slot} />
                    )}
                    {renderRowHeader === undefined
                      ? getLabel(row.node)
                      : renderRowHeader(row.node, rowState)}
                  </div>
                </th>
                {columns.map((column, index) => {
                  const description = describeCell?.(row.node, column, index);
                  const descriptionId =
                    description === undefined
                      ? undefined
                      : // Node ids may contain spaces, which an IDREF cannot.
                        `${descriptionPrefix}-${String(rowIndex)}-${String(index)}`;
                  return (
                    <td
                      key={column.id}
                      role="gridcell"
                      tabIndex={tabIndex(row.id, index + 1)}
                      aria-describedby={descriptionId}
                      className={styles.cell}
                    >
                      {renderCell(row.node, column, index)}
                      {description !== undefined && (
                        // Hidden from the cell's name; referenced by its
                        // description, which accname computes from hidden
                        // nodes that are referenced directly.
                        <VisuallyHidden id={descriptionId} aria-hidden="true">
                          {description}
                        </VisuallyHidden>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
