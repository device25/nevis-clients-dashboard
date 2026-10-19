// One test per key and focus situation of ACCESSIBILITY.md "Keyboard".
// Fully expanded, the visible rows are, in order: World, Europe, France,
// Paris, Lyon, Spain, Italy, Rome, Asia, Japan, Korea, Oceania.
import { act, screen } from '@testing-library/react';
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

function focus(element: HTMLElement) {
  act(() => {
    element.focus();
  });
}

function setup(props: Parameters<typeof renderHarness>[0] = {}) {
  const user = userEvent.setup();
  const result = renderHarness(props);
  return { user, ...result };
}

describe('TreeGrid keyboard, focus on a row', () => {
  it('ArrowDown moves to the next visible row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('Europe'));
    await user.keyboard('{ArrowDown}');
    expectFocusOn(row('France'));
    expect(row('World')).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowDown stops at the last row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('Oceania'));
    await user.keyboard('{ArrowDown}');
    expectFocusOn(row('Oceania'));
  });

  it('ArrowUp moves to the previous visible row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('Spain'));
    await user.keyboard('{ArrowUp}');
    expectFocusOn(row('Lyon'));
  });

  it('ArrowUp stops at the first row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('World'));
    await user.keyboard('{ArrowUp}');
    expectFocusOn(row('World'));
  });

  it('ArrowRight expands a collapsed parent and keeps focus on it', async () => {
    const { user } = setup();
    focus(row('Europe'));
    await user.keyboard('{ArrowRight}');
    expect(row('Europe')).toHaveAttribute('aria-expanded', 'true');
    expect(visibleRowNames()).toEqual([
      'World',
      'Europe',
      'France',
      'Spain',
      'Italy',
      'Asia',
      'Oceania',
    ]);
    expectFocusOn(row('Europe'));
  });

  it('ArrowRight on an expanded parent moves to its first cell', async () => {
    const { user } = setup();
    focus(row('World'));
    await user.keyboard('{ArrowRight}');
    expectFocusOn(cell('World', 0));
    expect(row('World')).toHaveAttribute('aria-expanded', 'true');
  });

  it('ArrowRight on a leaf moves to its first cell', async () => {
    const { user } = setup();
    focus(row('Oceania'));
    await user.keyboard('{ArrowRight}');
    expectFocusOn(cell('Oceania', 0));
  });

  it('ArrowLeft collapses an expanded parent and keeps focus on it', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('Europe'));
    await user.keyboard('{ArrowLeft}');
    expect(row('Europe')).toHaveAttribute('aria-expanded', 'false');
    expect(visibleRowNames()).toEqual([
      'World',
      'Europe',
      'Asia',
      'Japan',
      'Korea',
      'Oceania',
    ]);
    expectFocusOn(row('Europe'));
  });

  it('ArrowLeft on a collapsed parent moves to its parent row', async () => {
    const { user } = setup();
    focus(row('Asia'));
    await user.keyboard('{ArrowLeft}');
    expectFocusOn(row('World'));
    expect(row('World')).toHaveAttribute('aria-expanded', 'true');
  });

  it('ArrowLeft on a leaf moves to its parent row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('Lyon'));
    await user.keyboard('{ArrowLeft}');
    expectFocusOn(row('France'));
    expect(row('France')).toHaveAttribute('aria-expanded', 'true');
  });

  it('ArrowLeft on the collapsed root does nothing', async () => {
    const { user } = setup({ defaultExpandedIds: [] });
    focus(row('World'));
    await user.keyboard('{ArrowLeft}');
    expectFocusOn(row('World'));
    expect(row('World')).toHaveAttribute('aria-expanded', 'false');
  });

  it('Home and End move to the first and last visible row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('France'));
    await user.keyboard('{End}');
    expectFocusOn(row('Oceania'));
    await user.keyboard('{Home}');
    expectFocusOn(row('World'));
  });

  it('Ctrl+Home and Ctrl+End move to the first and last visible row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('Spain'));
    await user.keyboard('{Control>}{End}{/Control}');
    expectFocusOn(row('Oceania'));
    await user.keyboard('{Control>}{Home}{/Control}');
    expectFocusOn(row('World'));
  });

  it('PageDown moves 10 rows down, clamped at the last row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('World'));
    await user.keyboard('{PageDown}');
    expectFocusOn(row('Korea'));
    await user.keyboard('{PageDown}');
    expectFocusOn(row('Oceania'));
  });

  it('PageUp moves 10 rows up, clamped at the first row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(row('Oceania'));
    await user.keyboard('{PageUp}');
    expectFocusOn(row('Europe'));
    await user.keyboard('{PageUp}');
    expectFocusOn(row('World'));
  });

  it('Enter toggles a parent row and keeps the selection', async () => {
    const { user } = setup();
    focus(row('Europe'));
    await user.keyboard('{Enter}');
    expect(row('Europe')).toHaveAttribute('aria-expanded', 'true');
    expectFocusOn(row('Europe'));
    await user.keyboard('{Enter}');
    expect(row('Europe')).toHaveAttribute('aria-expanded', 'false');
    expectFocusOn(row('Europe'));
    expect(row('World')).toHaveAttribute('aria-selected', 'true');
    expect(row('Europe')).toHaveAttribute('aria-selected', 'false');
  });

  it('Enter on a leaf row does nothing', async () => {
    const onExpandedChange = vi.fn();
    const onSelect = vi.fn();
    const { user } = setup({ onExpandedChange, onSelect });
    focus(row('Oceania'));
    await user.keyboard('{Enter}');
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(row('Oceania')).not.toHaveAttribute('aria-expanded');
    expectFocusOn(row('Oceania'));
  });

  it('Space selects the row and leaves expansion alone', async () => {
    const onSelect = vi.fn();
    const { user } = setup({ onSelect });
    focus(row('Asia'));
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledWith('Asia');
    expect(row('Asia')).toHaveAttribute('aria-selected', 'true');
    expect(row('World')).toHaveAttribute('aria-selected', 'false');
    expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
    expect(visibleRowNames()).toEqual(['World', 'Europe', 'Asia', 'Oceania']);
    expectFocusOn(row('Asia'));
  });

  it('Tab leaves the grid, and Shift+Tab returns to the same row', async () => {
    const { user } = setup();
    focus(row('Europe'));
    await user.tab();
    expect(
      screen.getByRole('button', { name: 'After the grid' }),
    ).toHaveFocus();
    expectSingleTabStop();
    await user.tab({ shift: true });
    expectFocusOn(row('Europe'));
  });

  it('Tab from the page enters the grid on its single tab stop', async () => {
    const { user } = setup({ defaultSelectedId: 'Asia' });
    await user.tab();
    expectFocusOn(row('Asia'));
  });
});

describe('TreeGrid keyboard, focus on a cell', () => {
  it('ArrowDown moves to the same column in the next visible row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(cell('Europe', 2));
    await user.keyboard('{ArrowDown}');
    expectFocusOn(cell('France', 2));
  });

  it('ArrowDown stops at the last row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(cell('Oceania', 2));
    await user.keyboard('{ArrowDown}');
    expectFocusOn(cell('Oceania', 2));
  });

  it('ArrowUp moves to the same column in the previous visible row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(cell('France', 0));
    await user.keyboard('{ArrowUp}');
    expectFocusOn(cell('Europe', 0));
  });

  it('ArrowUp stops at the first row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(cell('World', 3));
    await user.keyboard('{ArrowUp}');
    expectFocusOn(cell('World', 3));
  });

  it('ArrowRight moves to the next cell', async () => {
    const { user } = setup();
    focus(cell('Europe', 0));
    await user.keyboard('{ArrowRight}');
    expectFocusOn(cell('Europe', 1));
    expect(row('Europe')).toHaveAttribute('aria-expanded', 'false');
  });

  it('ArrowRight stops at the last cell', async () => {
    const { user } = setup();
    focus(cell('Europe', 4));
    await user.keyboard('{ArrowRight}');
    expectFocusOn(cell('Europe', 4));
  });

  it('ArrowLeft on the first cell moves to its row', async () => {
    const { user } = setup();
    focus(cell('World', 0));
    await user.keyboard('{ArrowLeft}');
    expectFocusOn(row('World'));
    expect(row('World')).toHaveAttribute('aria-expanded', 'true');
  });

  it('ArrowLeft on another cell moves to the previous cell', async () => {
    const { user } = setup();
    focus(cell('World', 3));
    await user.keyboard('{ArrowLeft}');
    expectFocusOn(cell('World', 2));
    expect(row('World')).toHaveAttribute('aria-expanded', 'true');
  });

  it('Home and End move to the first and last cell of the row', async () => {
    const { user } = setup();
    focus(cell('Asia', 2));
    await user.keyboard('{End}');
    expectFocusOn(cell('Asia', 4));
    await user.keyboard('{Home}');
    expectFocusOn(cell('Asia', 0));
  });

  it('Ctrl+Home and Ctrl+End move to the same column in the first and last row', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(cell('France', 2));
    await user.keyboard('{Control>}{End}{/Control}');
    expectFocusOn(cell('Oceania', 2));
    await user.keyboard('{Control>}{Home}{/Control}');
    expectFocusOn(cell('World', 2));
  });

  it('PageDown moves 10 rows down in the same column, clamped', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(cell('World', 3));
    await user.keyboard('{PageDown}');
    expectFocusOn(cell('Korea', 3));
    await user.keyboard('{PageDown}');
    expectFocusOn(cell('Oceania', 3));
  });

  it('PageUp moves 10 rows up in the same column, clamped', async () => {
    const { user } = setup({ defaultExpandedIds: ALL_EXPANDED });
    focus(cell('Oceania', 1));
    await user.keyboard('{PageUp}');
    expectFocusOn(cell('Europe', 1));
    await user.keyboard('{PageUp}');
    expectFocusOn(cell('World', 1));
  });

  it('Enter toggles the row of the cell and keeps focus on the cell', async () => {
    const { user } = setup();
    focus(cell('Europe', 1));
    await user.keyboard('{Enter}');
    expect(row('Europe')).toHaveAttribute('aria-expanded', 'true');
    expectFocusOn(cell('Europe', 1));
    await user.keyboard('{Enter}');
    expect(row('Europe')).toHaveAttribute('aria-expanded', 'false');
    expectFocusOn(cell('Europe', 1));
  });

  it('Enter in a cell of a leaf row does nothing', async () => {
    const onExpandedChange = vi.fn();
    const { user } = setup({ onExpandedChange });
    focus(cell('Oceania', 2));
    await user.keyboard('{Enter}');
    expect(onExpandedChange).not.toHaveBeenCalled();
    expectFocusOn(cell('Oceania', 2));
  });

  it('Space selects the row of the cell and leaves expansion alone', async () => {
    const onSelect = vi.fn();
    const { user } = setup({ onSelect });
    focus(cell('Asia', 2));
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledWith('Asia');
    expect(row('Asia')).toHaveAttribute('aria-selected', 'true');
    expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
    expectFocusOn(cell('Asia', 2));
  });

  it('Tab leaves the grid, and Shift+Tab returns to the same cell', async () => {
    const { user } = setup();
    focus(cell('Asia', 2));
    await user.tab();
    expect(
      screen.getByRole('button', { name: 'After the grid' }),
    ).toHaveFocus();
    expectSingleTabStop();
    await user.tab({ shift: true });
    expectFocusOn(cell('Asia', 2));
  });
});

describe('TreeGrid scrolling', () => {
  it('scrolls the newly focused element into view by the nearest edge', async () => {
    const { user, scrollIntoView } = setup({
      defaultExpandedIds: ALL_EXPANDED,
    });
    focus(cell('World', 1));
    await user.keyboard('{Control>}{End}{/Control}');
    expect(scrollIntoView).toHaveBeenLastCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(cell('Oceania', 1));
    expectSingleTabStop();
  });
});
