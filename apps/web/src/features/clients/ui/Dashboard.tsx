import { useClientsTree } from '@nevis/data';
import { Stack, useTreeState } from '@nevis/design-system';
import { useEffect, useState } from 'react';
import { ChartCard } from './ChartCard';
import { TableCard } from './TableCard';

interface DashboardProps {
  /** Called once the dashboard has mounted with its data. */
  onLoaded: () => void;
}

/**
 * Owns what the user has done: which rows are open and which is selected.
 * The two never affect each other (D3).
 */
export function Dashboard({ onLoaded }: DashboardProps) {
  const root = useClientsTree();
  const tree = useTreeState({ defaultExpandedIds: [root.id] });
  const [selectedId, setSelectedId] = useState(root.id);

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  return (
    <Stack gap={4}>
      <ChartCard root={root} selectedId={selectedId} />
      <TableCard
        root={root}
        tree={tree}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </Stack>
  );
}
