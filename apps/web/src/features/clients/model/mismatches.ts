import { MONTHS, type HierarchyNode } from '@nevis/data';

/** A month in which a node's reported value differs from its children's sum. */
export interface Mismatch {
  readonly nodeId: string;
  readonly nodeName: string;
  /** 0 is Feb 2024, 11 is Jan 2025. */
  readonly monthIndex: number;
  readonly monthLabel: string;
  readonly reported: number;
  readonly childrenTotal: number;
}

function collect(node: HierarchyNode, found: Mismatch[]): void {
  if (node.children.length > 0) {
    node.values.forEach((reported, monthIndex) => {
      const childrenTotal = node.children.reduce(
        (sum, child) => sum + (child.values[monthIndex] ?? 0),
        0,
      );
      const month = MONTHS[monthIndex];
      if (reported !== childrenTotal && month !== undefined) {
        found.push({
          nodeId: node.id,
          nodeName: node.name,
          monthIndex,
          monthLabel: month.label,
          reported,
          childrenTotal,
        });
      }
    });
  }
  for (const child of node.children) {
    collect(child, found);
  }
}

/**
 * Every node and month whose reported value differs from the sum of its
 * children (D2). Parents come before their children, siblings in source
 * order, months in calendar order. Leaves have nothing to compare against.
 */
export function findMismatches(root: HierarchyNode): readonly Mismatch[] {
  const found: Mismatch[] = [];
  collect(root, found);
  return found;
}

export function getMismatch(
  mismatches: readonly Mismatch[],
  nodeId: string,
  monthIndex: number,
): Mismatch | undefined {
  return mismatches.find(
    (m) => m.nodeId === nodeId && m.monthIndex === monthIndex,
  );
}

/** The text of the visually hidden description a mismatch cell points at. */
export function describeMismatch(mismatch: Mismatch): string {
  return `Reported ${String(mismatch.reported)}, children add up to ${String(mismatch.childrenTotal)}.`;
}
