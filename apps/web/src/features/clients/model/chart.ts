import { MONTHS, type HierarchyNode } from '@nevis/data';

export type MonthlyValues = HierarchyNode['values'];

export type Grouping =
  'By branch' | 'By adviser' | 'By acquisition channel' | 'Monthly total';

export interface ChartSeries {
  readonly id: string;
  readonly name: string;
  readonly values: MonthlyValues;
  /** Position among the parent's children, so a node keeps its colour. */
  readonly colorIndex: number;
}

export interface ChartModel {
  /** Names from the root down to the scope node. */
  readonly scopePath: readonly string[];
  readonly grouping: Grouping;
  readonly series: readonly ChartSeries[];
  /** False at a leaf, where the one series is the node's own values. */
  readonly hasChildren: boolean;
  /** Sum of the series in each month: the height of each stack. */
  readonly childTotals: MonthlyValues;
  /** The scope node's own reported values (D1). */
  readonly reported: MonthlyValues;
}

/** The note D3 shows under the legend at Company scope. */
export const SCOPE_NOTE =
  'Acquisition channels are recorded for one adviser only, so the company view is split by branch. Select Anna Blackwood to see the channel split.';

interface Scope {
  readonly node: HierarchyNode;
  /** Nodes from the root down to `node`. */
  readonly path: readonly HierarchyNode[];
  /** Position of `node` among its parent's children; 0 for the root. */
  readonly position: number;
}

function locate(
  node: HierarchyNode,
  id: string,
  path: readonly HierarchyNode[],
  position: number,
): Scope | undefined {
  const here = [...path, node];
  if (node.id === id) {
    return { node, path: here, position };
  }
  for (const [index, child] of node.children.entries()) {
    const found = locate(child, id, here, index);
    if (found) {
      return found;
    }
  }
  return undefined;
}

// An unknown id falls back to the root: the chart must always have a scope
// (D17), and the root is the scope the page opens with.
function scopeOf(root: HierarchyNode, selectedId: string): Scope {
  return (
    locate(root, selectedId, [], 0) ?? { node: root, path: [root], position: 0 }
  );
}

function groupingOf(node: HierarchyNode): Grouping {
  switch (node.children[0]?.kind) {
    case 'branch':
      return 'By branch';
    case 'adviser':
      return 'By adviser';
    case 'channel':
      return 'By acquisition channel';
    default:
      return 'Monthly total';
  }
}

// Written out so the result is a 12-tuple without a type assertion.
function perMonth(valueAt: (monthIndex: number) => number): MonthlyValues {
  return [
    valueAt(0),
    valueAt(1),
    valueAt(2),
    valueAt(3),
    valueAt(4),
    valueAt(5),
    valueAt(6),
    valueAt(7),
    valueAt(8),
    valueAt(9),
    valueAt(10),
    valueAt(11),
  ];
}

/**
 * What the chart shows for the selected row (D3): one series per child, or
 * the row's own values when it has no children.
 */
export function toChartModel(
  root: HierarchyNode,
  selectedId: string,
): ChartModel {
  const { node, path, position } = scopeOf(root, selectedId);
  const series: readonly ChartSeries[] =
    node.children.length > 0
      ? node.children.map((child, colorIndex) => ({
          id: child.id,
          name: child.name,
          values: child.values,
          colorIndex,
        }))
      : [
          {
            id: node.id,
            name: node.name,
            values: node.values,
            colorIndex: position,
          },
        ];
  return {
    scopePath: path.map((step) => step.name),
    grouping: groupingOf(node),
    series,
    hasChildren: node.children.length > 0,
    childTotals: perMonth((monthIndex) =>
      series.reduce((sum, s) => sum + (s.values[monthIndex] ?? 0), 0),
    ),
    reported: node.values,
  };
}

/**
 * The name of the chart image: the full scope path (joined as in the visible
 * path text), the grouping, the period and the range of the stack totals.
 */
export function chartAccessibleName(model: ChartModel): string {
  const scope = model.scopePath.join(' › ');
  const first = MONTHS[0].label;
  const last = MONTHS[MONTHS.length - 1]?.label ?? first;
  const low = Math.min(...model.childTotals);
  const high = Math.max(...model.childTotals);
  return `${scope}, ${model.grouping.toLowerCase()}, ${first} to ${last}, between ${String(low)} and ${String(high)} a month.`;
}

/** The scope note applies at Company scope (D3). */
export function showsScopeNote(
  root: HierarchyNode,
  selectedId: string,
): boolean {
  return scopeOf(root, selectedId).node.kind === 'company';
}
