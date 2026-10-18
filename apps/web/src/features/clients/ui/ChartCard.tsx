import type { HierarchyNode } from '@nevis/data';
import {
  Inline,
  StackedBarChart,
  Stack,
  Surface,
  Text,
  VisuallyHidden,
} from '@nevis/design-system';
import { useId } from 'react';
import {
  chartAccessibleName,
  SCOPE_NOTE,
  showsScopeNote,
  toChartModel,
} from '#model';
import { CATEGORIES } from './categories';
import { WidgetBoundary } from './WidgetBoundary';

interface ChartCardProps {
  root: HierarchyNode;
  selectedId: string;
}

function Chart({ root, selectedId }: ChartCardProps) {
  const nameId = useId();
  const model = toChartModel(root, selectedId);
  const current = model.scopePath.at(-1);
  const ancestors = model.scopePath.slice(0, -1);

  return (
    <Stack gap={4}>
      <VisuallyHidden id={nameId}>{chartAccessibleName(model)}</VisuallyHidden>
      <Inline gap={4} justify="between" wrap>
        <Text as="div" variant="footnote" tone="secondary">
          {ancestors.map((name) => `${name} › `)}
          <Text as="span" variant="footnote" tone="primary">
            {current}
          </Text>
        </Text>
        <Text as="div" variant="footnote" tone="secondary">
          {model.grouping}
        </Text>
      </Inline>
      <StackedBarChart
        categories={CATEGORIES}
        series={model.series}
        labelledBy={nameId}
        tooltipExtra={(index) => {
          const childrenTotal = model.childTotals[index] ?? 0;
          const reported = model.reported[index] ?? 0;
          return [
            { label: 'Children total', value: childrenTotal },
            // Only a difference is news (D2).
            ...(reported === childrenTotal
              ? []
              : [{ label: 'Reported total', value: reported }]),
          ];
        }}
      />
      {showsScopeNote(root, selectedId) && (
        <Text variant="footnote" tone="secondary" align="center">
          {SCOPE_NOTE}
        </Text>
      )}
    </Stack>
  );
}

/** The chart follows the selected row and nothing else (D3). */
export function ChartCard({ root, selectedId }: ChartCardProps) {
  const headingId = useId();
  return (
    <Surface as="section" padding="card" aria-labelledby={headingId}>
      <VisuallyHidden as="h2" id={headingId}>
        Chart
      </VisuallyHidden>
      <WidgetBoundary
        title="The chart could not be displayed"
        message="The table still shows every figure."
      >
        <Chart root={root} selectedId={selectedId} />
      </WidgetBoundary>
    </Surface>
  );
}
