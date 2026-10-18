import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTreeState } from './useTreeState';

describe('useTreeState', () => {
  it('starts from the default expanded ids when uncontrolled', () => {
    const { result } = renderHook(() =>
      useTreeState({ defaultExpandedIds: ['a', 'b'] }),
    );
    expect([...result.current.expandedIds]).toEqual(['a', 'b']);
    expect(result.current.isExpanded('a')).toBe(true);
    expect(result.current.isExpanded('c')).toBe(false);
  });

  it('stores the ids it is given when uncontrolled and reports them', () => {
    const onExpandedChange = vi.fn();
    const { result } = renderHook(() =>
      useTreeState({ defaultExpandedIds: ['a'], onExpandedChange }),
    );
    act(() => {
      result.current.onExpandedChange(new Set(['a', 'b']));
    });
    expect([...result.current.expandedIds]).toEqual(['a', 'b']);
    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['a', 'b']));
  });

  it('toggles, expands and collapses one id', () => {
    const { result } = renderHook(() =>
      useTreeState({ defaultExpandedIds: [] }),
    );
    act(() => {
      result.current.toggle('a');
    });
    expect(result.current.isExpanded('a')).toBe(true);
    act(() => {
      result.current.collapse('a');
    });
    expect(result.current.isExpanded('a')).toBe(false);
    act(() => {
      result.current.expand('a');
    });
    expect(result.current.isExpanded('a')).toBe(true);
  });

  it('keeps a descendant expanded when its ancestor collapses', () => {
    const { result } = renderHook(() =>
      useTreeState({ defaultExpandedIds: ['parent', 'child'] }),
    );
    act(() => {
      result.current.collapse('parent');
    });
    expect(result.current.isExpanded('child')).toBe(true);
    act(() => {
      result.current.expand('parent');
    });
    expect([...result.current.expandedIds].sort()).toEqual(['child', 'parent']);
  });

  it('follows expandedIds when controlled and only reports changes', () => {
    const onExpandedChange = vi.fn();
    const controlled = new Set(['x']);
    const { result } = renderHook(() =>
      useTreeState({
        defaultExpandedIds: ['ignored'],
        expandedIds: controlled,
        onExpandedChange,
      }),
    );
    expect(result.current.expandedIds).toBe(controlled);
    act(() => {
      result.current.expand('y');
    });
    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['x', 'y']));
    expect([...result.current.expandedIds]).toEqual(['x']);
  });
});
