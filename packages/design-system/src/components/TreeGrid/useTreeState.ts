import { useState } from 'react';

export interface UseTreeStateOptions {
  /** Expanded rows on mount when uncontrolled. Ignored when `expandedIds` is given. */
  defaultExpandedIds?: Iterable<string>;
  /** Makes the state controlled: the hook reports changes but stores nothing. */
  expandedIds?: ReadonlySet<string>;
  /** Called with the complete new set after every change. */
  onExpandedChange?: (expandedIds: ReadonlySet<string>) => void;
}

export interface TreeState {
  /** Pass to `TreeGrid`'s `expandedIds`. */
  expandedIds: ReadonlySet<string>;
  /** Pass to `TreeGrid`'s `onExpandedChange`. */
  onExpandedChange: (expandedIds: ReadonlySet<string>) => void;
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  expand: (id: string) => void;
  collapse: (id: string) => void;
}

/**
 * Expansion state for `TreeGrid`, controlled or uncontrolled.
 *
 * The set holds every row the user has expanded, whether or not it is visible.
 * Collapsing a row removes only that row's id, so its descendants keep their
 * state and reappear as they were when the row is expanded again.
 */
export function useTreeState({
  defaultExpandedIds = [],
  expandedIds: controlled,
  onExpandedChange,
}: UseTreeStateOptions = {}): TreeState {
  const [uncontrolled, setUncontrolled] = useState<ReadonlySet<string>>(
    () => new Set(defaultExpandedIds),
  );
  const expandedIds = controlled ?? uncontrolled;

  function change(next: ReadonlySet<string>) {
    if (controlled === undefined) setUncontrolled(next);
    onExpandedChange?.(next);
  }

  function set(id: string, expanded: boolean) {
    if (expandedIds.has(id) === expanded) return;
    const next = new Set(expandedIds);
    if (expanded) next.add(id);
    else next.delete(id);
    change(next);
  }

  return {
    expandedIds,
    onExpandedChange: change,
    isExpanded: (id) => expandedIds.has(id),
    toggle: (id) => {
      set(id, !expandedIds.has(id));
    },
    expand: (id) => {
      set(id, true);
    },
    collapse: (id) => {
      set(id, false);
    },
  };
}
