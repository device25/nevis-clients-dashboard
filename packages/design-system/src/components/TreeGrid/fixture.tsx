// Test support for the TreeGrid tests: a generic tree and a harness that wires
// TreeGrid to useTreeState the way an application would. Not exported.
import {
  render,
  screen,
  within,
  type RenderResult,
} from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { expect, vi, type Mock } from 'vitest';
import { TreeGrid, type TreeGridColumn } from './TreeGrid';
import { useTreeState } from './useTreeState';

export interface Place {
  id: string;
  name: string;
  values: readonly number[];
  children: readonly Place[];
}

function place(
  id: string,
  values: readonly number[],
  children: readonly Place[] = [],
): Place {
  return { id, name: id, values, children };
}

/**
 * Twelve rows when fully expanded, four levels, seven leaves:
 *
 * World
 *   Europe
 *     France
 *       Paris, Lyon
 *     Spain
 *     Italy
 *       Rome
 *   Asia
 *     Japan, Korea
 *   Oceania
 */
export const world: Place = place(
  'World',
  [100, 110, 120, 130],
  [
    place(
      'Europe',
      [60, 61, 62, 63],
      [
        place(
          'France',
          [30, 31, 32, 33],
          [place('Paris', [20, 21, 22, 23]), place('Lyon', [10, 10, 10, 10])],
        ),
        place('Spain', [20, 20, 20, 20]),
        place('Italy', [10, 10, 10, 10], [place('Rome', [10, 10, 10, 10])]),
      ],
    ),
    place(
      'Asia',
      [30, 39, 48, 57],
      [place('Japan', [15, 19, 24, 28]), place('Korea', [15, 20, 24, 29])],
    ),
    place('Oceania', [10, 10, 10, 10]),
  ],
);

export const PARENT_IDS = ['World', 'Europe', 'France', 'Italy', 'Asia'];

export const columns: readonly TreeGridColumn[] = [
  { id: 'q1', header: 'Q1' },
  { id: 'q2', header: 'Q2' },
  { id: 'q3', header: 'Q3' },
  { id: 'q4', header: 'Q4' },
];

interface HarnessProps {
  defaultExpandedIds?: Iterable<string>;
  defaultSelectedId?: string | null;
  onSelect?: (id: string) => void;
  onExpandedChange?: (ids: ReadonlySet<string>) => void;
  describeCell?: (place: Place, columnIndex: number) => string | undefined;
  renderCell?: (place: Place, columnIndex: number) => ReactNode;
}

export function Harness({
  defaultExpandedIds = ['World'],
  defaultSelectedId = 'World',
  onSelect,
  onExpandedChange,
  describeCell,
  renderCell = (node, index) => node.values[index],
}: HarnessProps) {
  const tree = useTreeState({
    defaultExpandedIds,
    ...(onExpandedChange === undefined ? {} : { onExpandedChange }),
  });
  const [selectedId, setSelectedId] = useState(defaultSelectedId);
  return (
    <>
      <h2 id="places-heading">Places</h2>
      <TreeGrid
        root={world}
        getId={(node) => node.id}
        getChildren={(node) => node.children}
        getLabel={(node) => node.name}
        columns={columns}
        renderRowHeader={(node) => <span>{node.name}</span>}
        renderCell={(node, _column, index) => renderCell(node, index)}
        {...(describeCell === undefined
          ? {}
          : {
              describeCell: (node: Place, _column: TreeGridColumn, index) =>
                describeCell(node, index),
            })}
        nameColumnLabel="Place"
        labelledBy="places-heading"
        expandedIds={tree.expandedIds}
        onExpandedChange={tree.onExpandedChange}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          onSelect?.(id);
        }}
      />
      <button type="button">After the grid</button>
    </>
  );
}

export const ALL_EXPANDED = PARENT_IDS;

export function renderHarness(
  props: HarnessProps = {},
): RenderResult & { scrollIntoView: Mock } {
  // jsdom does no layout and has no scrollIntoView.
  const scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  const result = render(<Harness {...props} />);
  return { ...result, scrollIntoView };
}

export function grid(): HTMLElement {
  return screen.getByRole('treegrid');
}

/** Body rows only: the header row has no level. */
export function bodyRows(): HTMLElement[] {
  return within(grid())
    .getAllByRole('row')
    .filter((row) => row.hasAttribute('aria-level'));
}

export function row(name: string): HTMLElement {
  return within(grid()).getByRole('row', { name });
}

/** Cell `index` of a row: 0 is the row header, 1 onwards are the gridcells. */
export function cell(rowName: string, index: number): HTMLElement {
  const found = cellsOf(row(rowName))[index];
  if (found === undefined) throw new Error(`No cell ${String(index)}`);
  return found;
}

/** Row headers and gridcells inside `container`, in document order. */
export function cellsOf(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      '[role="rowheader"], [role="gridcell"]',
    ),
  );
}

export function visibleRowNames(): (string | null)[] {
  return bodyRows().map((element) => element.getAttribute('aria-label'));
}

/** WAI-ARIA roving tabindex: exactly one element of the grid is in the tab order. */
export function expectSingleTabStop(): void {
  const stops = grid().querySelectorAll('[tabindex="0"]');
  expect(stops).toHaveLength(1);
}
