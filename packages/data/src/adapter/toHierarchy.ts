import { ClientNodeSchema, type RawClientNode } from '@nevis/contract';
import { DataError } from '#transport';
import type { HierarchyNode, NodeKind } from './types';

// The payload names its child lists by role; the depth alone decides the kind.
const KINDS = [
  'company',
  'branch',
  'adviser',
  'channel',
] as const satisfies readonly NodeKind[];
const LEVELS = [1, 2, 3, 4] as const;

// The schema's recursive type erases the children to loose records. The input
// is already validated, so parsing a child only restores its type.
const typed = (list: readonly unknown[] | undefined): RawClientNode[] =>
  (list ?? []).map((child) => ClientNodeSchema.parse(child));

function convert(raw: RawClientNode, depth: number): HierarchyNode {
  const kind = KINDS[depth];
  const level = LEVELS[depth];
  const children = [
    ...typed(raw.branches),
    ...typed(raw.employees),
    ...typed(raw.channels),
  ];
  // The schema allows any depth. Dropping a fifth level would hide data, so
  // the response counts as unreadable instead.
  if (
    kind === undefined ||
    level === undefined ||
    (depth === KINDS.length - 1 && children.length > 0)
  ) {
    throw new DataError('invalid-response');
  }
  return {
    id: raw.id,
    name: raw.name,
    kind,
    level,
    values: raw.values,
    children: children.map((child) => convert(child, depth + 1)),
  };
}

export function toHierarchy(raw: RawClientNode): HierarchyNode {
  return convert(raw, 0);
}
