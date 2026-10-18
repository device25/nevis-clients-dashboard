import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ALL_EXPANDED,
  cell,
  expectFocusOn,
  expectSingleTabStop,
  renderHarness,
  row,
  visibleRowNames,
} from './fixture';
import type { TreeState } from './useTreeState';

function focus(element: HTMLElement) {
  act(() => {
    element.focus();
  });
}

function chevronOf(name: string): Element {
  const chevron = within(row(name)).getByRole('rowheader').querySelector('svg');
  if (chevron === null) throw new Error(`${name} has no chevron`);
  return chevron;
}

describe('TreeGrid pointer', () => {
  it('selects and focuses the row when a cell is clicked, without expanding it', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderHarness({ onSelect });
    await user.click(cell('Europe', 3));
    expect(onSelect).toHaveBeenCalledWith('Europe');
    expect(row('Europe')).toHaveAttribute('aria-selected', 'true');
    expect(row('World')).toHaveAttribute('aria-selected', 'false');
    expect(row('Europe')).toHaveAttribute('aria-expanded', 'false');
    expectFocusOn(row('Europe'));
  });

  it('selects a leaf when its name is clicked', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(within(row('Oceania')).getByText('Oceania'));
    expect(row('Oceania')).toHaveAttribute('aria-selected', 'true');
    expectFocusOn(row('Oceania'));
  });

  it('toggles expansion and focuses the row when the chevron is clicked, without selecting', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderHarness({ onSelect });
    await user.click(chevronOf('Asia'));
    expect(row('Asia')).toHaveAttribute('aria-expanded', 'true');
    expect(visibleRowNames()).toEqual([
      'World',
      'Europe',
      'Asia',
      'Japan',
      'Korea',
      'Oceania',
    ]);
    expectFocusOn(row('Asia'));
    await user.click(chevronOf('Asia'));
    expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
    expect(onSelect).not.toHaveBeenCalled();
    expect(row('World')).toHaveAttribute('aria-selected', 'true');
  });
});

describe('TreeGrid focus recovery', () => {
  it('moves focus to the collapsed row when its chevron hides the focused row', async () => {
    const user = userEvent.setup();
    renderHarness({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('Paris'));
    await user.click(chevronOf('Europe'));
    expect(visibleRowNames()).not.toContain('Paris');
    expectFocusOn(row('Europe'));
  });

  it('moves focus to the collapsed ancestor when a collapse from outside hides the focused cell', () => {
    const treeRef: { current: TreeState | null } = { current: null };
    const { scrollIntoView } = renderHarness({
      defaultExpandedIds: ALL_EXPANDED,
      treeRef,
    });
    focus(cell('Paris', 2));
    act(() => {
      treeRef.current?.collapse('Europe');
    });
    expectFocusOn(row('Europe'));
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(row('Europe'));
  });

  it('moves focus to the nearest visible ancestor when a higher ancestor collapses', () => {
    const treeRef: { current: TreeState | null } = { current: null };
    renderHarness({ defaultExpandedIds: ALL_EXPANDED, treeRef });
    focus(row('Rome'));
    act(() => {
      treeRef.current?.collapse('World');
    });
    expect(visibleRowNames()).toEqual(['World']);
    expectFocusOn(row('World'));
  });

  it('moves only the tab stop when focus is outside the grid', () => {
    const treeRef: { current: TreeState | null } = { current: null };
    renderHarness({ defaultExpandedIds: ALL_EXPANDED, treeRef });
    focus(row('Paris'));
    const after = screen.getByRole('button', { name: 'After the grid' });
    focus(after);
    act(() => {
      treeRef.current?.collapse('France');
    });
    expect(after).toHaveFocus();
    expect(row('France')).toHaveAttribute('tabindex', '0');
    expectSingleTabStop();
    act(() => {
      treeRef.current?.expand('France');
    });
    // The tab stop stays where focus recovery put it.
    expect(row('France')).toHaveAttribute('tabindex', '0');
    expect(row('Paris')).toHaveAttribute('tabindex', '-1');
    expectSingleTabStop();
  });

  it('restores the previous expansion of descendants when a row is expanded again', async () => {
    const user = userEvent.setup();
    renderHarness({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('Europe'));
    await user.keyboard('{ArrowLeft}');
    expect(visibleRowNames()).not.toContain('France');
    await user.keyboard('{ArrowRight}');
    expect(visibleRowNames()).toEqual([
      'World',
      'Europe',
      'France',
      'Paris',
      'Lyon',
      'Spain',
      'Italy',
      'Rome',
      'Asia',
      'Japan',
      'Korea',
      'Oceania',
    ]);
    expectFocusOn(row('Europe'));
  });
});
