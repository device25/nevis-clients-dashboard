import { MONTHS, type HierarchyNode } from '@nevis/data';
import {
  Avatar,
  StatusDot,
  Surface,
  TreeGrid,
  VisuallyHidden,
  type TreeGridColumn,
  type TreeState,
} from '@nevis/design-system';
import { useId } from 'react';
import { describeMismatch, findMismatches, getMismatch } from '#model';
import { CLIENTS_HEADING_ID } from './ids';
import { WidgetBoundary } from './WidgetBoundary';

const COLUMNS: readonly TreeGridColumn[] = MONTHS.map((month) => ({
  id: month.key,
  header: month.label,
}));

interface TableCardProps {
  root: HierarchyNode;
  tree: TreeState;
  selectedId: string;
  onSelect: (id: string) => void;
}

function Table({ root, tree, selectedId, onSelect }: TableCardProps) {
  const mismatches = findMismatches(root);

  return (
    <TreeGrid
      root={root}
      getId={(node) => node.id}
      getChildren={(node) => node.children}
      getLabel={(node) => node.name}
      nameColumnLabel="Name"
      columns={COLUMNS}
      renderRowHeader={(node) =>
        node.kind === 'adviser' ? (
          <>
            <Avatar id={node.id} name={node.name} />
            {node.name}
          </>
        ) : (
          node.name
        )
      }
      renderCell={(node, _column, index) => {
        const value = node.values[index];
        return getMismatch(mismatches, node.id, index) ? (
          <>
            <StatusDot />
            {value}
          </>
        ) : (
          value
        );
      }}
      describeCell={(node, _column, index) => {
        const mismatch = getMismatch(mismatches, node.id, index);
        return mismatch ? describeMismatch(mismatch) : undefined;
      }}
      labelledBy={CLIENTS_HEADING_ID}
      expandedIds={tree.expandedIds}
      onExpandedChange={tree.onExpandedChange}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}

/** Expansion and selection are owned by the dashboard; this only draws them. */
export function TableCard(props: TableCardProps) {
  const headingId = useId();
  return (
    <Surface as="section" aria-labelledby={headingId}>
      <VisuallyHidden as="h2" id={headingId}>
        Table
      </VisuallyHidden>
      <WidgetBoundary
        title="The table could not be displayed"
        message="The chart is not affected."
      >
        <Table {...props} />
      </WidgetBoundary>
    </Surface>
  );
}
