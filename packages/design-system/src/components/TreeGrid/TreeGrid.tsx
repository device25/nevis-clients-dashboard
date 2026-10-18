import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { cx } from '#tokens';
import { Chevron, VisuallyHidden } from '#primitives';
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
  /** Content of the column header. */
  header: ReactNode;
  /** Text alignment of the header and the cells. Default `'end'`, for numbers. */
  align?: 'start' | 'end';
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
  selectedId,
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

  return (
    <div className={styles.scroller}>
      <table
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- a native table with the treegrid role is the markup of ACCESSIBILITY.md and of the APG treegrid example
        role="treegrid"
        aria-labelledby={labelledBy}
        className={styles.table}
        style={{ '--treegrid-columns': columns.length } as CSSProperties}
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
                className={cx(
                  styles.cell,
                  styles.columnHeader,
                  column.align === 'start' && styles.alignStart,
                )}
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
                      className={cx(
                        styles.cell,
                        column.align === 'start' && styles.alignStart,
                      )}
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
