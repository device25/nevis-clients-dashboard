import { render, screen, within } from '@testing-library/react';
import { expectNoAxeViolations } from '#test-support/axe';
import { describe, expect, it, vi } from 'vitest';
import {
  ALL_EXPANDED,
  columns,
  world,
  bodyRows,
  cell,
  cellsOf,
  expectSingleTabStop,
  grid,
  renderHarness,
  row,
  visibleRowNames,
} from './fixture';
import { TreeGrid } from './TreeGrid';

describe('TreeGrid structure', () => {
  it('is a native table with the treegrid role, labelled by the heading', () => {
    renderHarness();
    const table = screen.getByRole('treegrid', { name: 'Places' });
    expect(table.tagName).toBe('TABLE');
    expect(table).toHaveAttribute('aria-labelledby', 'places-heading');
    expect(table).not.toHaveAttribute('aria-multiselectable');
  });

  it('has a header row with a visually empty first header and one header per column', () => {
    renderHarness();
    const headers = within(grid()).getAllByRole('columnheader');
    // The first header shows nothing; its name exists only for assistive
    // technology, because an unnamed header is reported as an error.
    expect(headers.map((header) => header.textContent)).toEqual([
      'Place',
      'Q1',
      'Q2',
      'Q3',
      'Q4',
    ]);
    const headerRow = within(grid()).getAllByRole('row')[0];
    expect(headerRow).not.toHaveAttribute('aria-level');
    expect(headerRow).not.toHaveAttribute('tabindex');
  });

  it('renders each body row as a row header and one gridcell per column', () => {
    renderHarness();
    const world = row('World');
    const header = within(world).getByRole('rowheader');
    expect(header.tagName).toBe('TH');
    expect(header).toHaveAttribute('scope', 'row');
    expect(header).toHaveTextContent('World');
    expect(
      within(world)
        .getAllByRole('gridcell')
        .map((gridcell) => gridcell.textContent),
    ).toEqual(['100', '110', '120', '130']);
  });

  it('renders only the root and its children when only the root is expanded', () => {
    renderHarness();
    expect(visibleRowNames()).toEqual(['World', 'Europe', 'Asia', 'Oceania']);
  });

  it('sets level, set size and position on every row of the fully expanded tree', () => {
    renderHarness({ defaultExpandedIds: ALL_EXPANDED });
    expect(
      bodyRows().map((element) => [
        element.getAttribute('aria-label'),
        element.getAttribute('aria-level'),
        element.getAttribute('aria-setsize'),
        element.getAttribute('aria-posinset'),
      ]),
    ).toEqual([
      ['World', '1', '1', '1'],
      ['Europe', '2', '3', '1'],
      ['France', '3', '3', '1'],
      ['Paris', '4', '2', '1'],
      ['Lyon', '4', '2', '2'],
      ['Spain', '3', '3', '2'],
      ['Italy', '3', '3', '3'],
      ['Rome', '4', '1', '1'],
      ['Asia', '2', '3', '2'],
      ['Japan', '3', '2', '1'],
      ['Korea', '3', '2', '2'],
      ['Oceania', '2', '3', '3'],
    ]);
  });

  it('sets aria-expanded only on rows with children', () => {
    renderHarness({ defaultExpandedIds: ['World', 'Europe'] });
    expect(row('World')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Europe')).toHaveAttribute('aria-expanded', 'true');
    expect(row('France')).toHaveAttribute('aria-expanded', 'false');
    expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no aria-expanded on any of the seven leaf rows of the fully expanded tree', () => {
    renderHarness({ defaultExpandedIds: ALL_EXPANDED });
    for (const name of [
      'Paris',
      'Lyon',
      'Spain',
      'Rome',
      'Japan',
      'Korea',
      'Oceania',
    ]) {
      expect(row(name)).not.toHaveAttribute('aria-expanded');
    }
  });

  it('marks the selected row true and every other body row false', () => {
    renderHarness({ defaultSelectedId: 'Europe' });
    expect(
      bodyRows().map((element) => element.getAttribute('aria-selected')),
    ).toEqual(['false', 'true', 'false', 'false']);
  });

  it('hides the chevron from assistive technology', () => {
    renderHarness();
    const header = within(row('World')).getByRole('rowheader');
    const chevron = header.querySelector('svg');
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
  });

  it('puts the selected row in the tab order when it is visible', () => {
    renderHarness({ defaultSelectedId: 'Asia' });
    expectSingleTabStop();
    expect(row('Asia')).toHaveAttribute('tabindex', '0');
    for (const element of bodyRows().filter((r) => r !== row('Asia'))) {
      expect(element).toHaveAttribute('tabindex', '-1');
    }
    for (const gridcell of cellsOf(grid())) {
      expect(gridcell).toHaveAttribute('tabindex', '-1');
    }
  });

  it('puts the first row in the tab order when the selected row is hidden', () => {
    renderHarness({ defaultSelectedId: 'Paris' });
    expectSingleTabStop();
    expect(row('World')).toHaveAttribute('tabindex', '0');
  });

  it('puts the first row in the tab order when nothing is selected', () => {
    renderHarness({ defaultSelectedId: null });
    expectSingleTabStop();
    expect(row('World')).toHaveAttribute('tabindex', '0');
  });

  it('describes a gridcell with visually hidden text when asked to', () => {
    renderHarness({
      describeCell: (node, index) =>
        node.id === 'Europe' && index === 1
          ? 'Reported 61, children add up to 51.'
          : undefined,
    });
    const described = cell('Europe', 2);
    expect(described).toHaveAccessibleDescription(
      'Reported 61, children add up to 51.',
    );
    // The description is not part of the cell's own text.
    expect(described).toHaveAccessibleName('61');
    expect(cell('Europe', 1)).not.toHaveAttribute('aria-describedby');
    expect(cell('Asia', 2)).not.toHaveAttribute('aria-describedby');
  });

  it('renders whatever the application puts in a cell', () => {
    renderHarness({
      renderCell: (node, index) => (
        <>
          <span aria-hidden="true">*</span>
          {node.values[index]}
        </>
      ),
    });
    expect(cell('World', 1)).toHaveTextContent('*100');
  });

  it('gives the row header renderer the level, expansion and selection of its row', () => {
    const states: string[] = [];
    render(
      <TreeGrid
        root={world}
        getId={(node) => node.id}
        getChildren={(node) => node.children}
        getLabel={(node) => node.name}
        columns={columns}
        nameColumnLabel="Place"
        renderRowHeader={(node, state) => {
          states.push(
            `${node.id} ${String(state.level)} ${String(state.expanded)} ${String(state.selected)}`,
          );
          return node.name;
        }}
        renderCell={(node, _column, index) => node.values[index]}
        labelledBy="places-heading"
        expandedIds={new Set(['World'])}
        onExpandedChange={vi.fn()}
        selectedId="Asia"
        onSelect={vi.fn()}
      />,
    );
    expect(states.slice(-4)).toEqual([
      'World 1 true false',
      'Europe 2 false false',
      'Asia 2 false true',
      'Oceania 2 undefined false',
    ]);
  });

  it('has no axe violations when collapsed', async () => {
    const { container } = renderHarness({ defaultExpandedIds: [] });
    expect(visibleRowNames()).toEqual(['World']);
    await expectNoAxeViolations(container);
  });

  it('has no axe violations when fully expanded, with a described cell', async () => {
    const { container } = renderHarness({
      defaultExpandedIds: ALL_EXPANDED,
      describeCell: (node, index) =>
        node.id === 'World' && index === 0 ? 'Flagged.' : undefined,
    });
    expect(bodyRows()).toHaveLength(12);
    await expectNoAxeViolations(container);
  });
});
