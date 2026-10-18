export type NodeKind = 'company' | 'branch' | 'adviser' | 'channel';

export interface HierarchyNode {
  readonly id: string;
  readonly name: string;
  readonly kind: NodeKind;
  /** Depth in the tree: 1 company, 2 branch, 3 adviser, 4 channel. */
  readonly level: 1 | 2 | 3 | 4;
  /** One reported count per month, Feb 2024 to Jan 2025. */
  readonly values: readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  /** In source order; empty on leaves. */
  readonly children: readonly HierarchyNode[];
}
