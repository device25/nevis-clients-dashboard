import { useEffect, useId, useState, type PointerEvent } from 'react';
import { chartColor } from '#tokens';
import { estimateTextWidth, planXLabels } from './axisLabels';
import { computeLayout, type ChartLayout } from './layout';
import { niceScale } from './niceScale';
import styles from './StackedBarChart.module.scss';
import { useElementWidth } from './useElementWidth';

export interface ChartCategory {
  /** Full label: the axis on wide charts and the tooltip heading. */
  label: string;
  /** Axis label on narrow charts. Falls back to `label`. */
  shortLabel?: string | undefined;
  /** Second axis line on narrow charts, for example the year of the first and last column. */
  shortCaption?: string | undefined;
}

export interface ChartSeries {
  id: string;
  /** Legend and tooltip text. */
  name: string;
  /** One value per category, in category order. */
  values: readonly number[];
  /**
   * Zero-based index into the five series colours. Defaults to the position
   * in `series`; set it to keep a series' colour when it is shown alone.
   */
  colorIndex?: number | undefined;
}

/** A line under the divider in the tooltip, for example a total. */
export interface ChartTooltipLine {
  label: string;
  value: string | number;
}

export interface StackedBarChartProps {
  /** One column each; the chart draws as many columns as there are categories. */
  categories: readonly ChartCategory[];
  /** Stacked bottom to top in this order, which is also the legend order. */
  series: readonly ChartSeries[];
  /** Id of the element whose text names the chart for assistive technology. */
  labelledBy: string;
  /** Plot height on a wide chart, in px. Default 358. */
  height?: number;
  /** Plot height on a narrow chart, in px. Default 220. */
  narrowHeight?: number;
  /** Lines shown under the series in the tooltip of category `index`. */
  tooltipExtra?: (index: number) => readonly ChartTooltipLine[];
}

const TOOLTIP_OFFSET = 8;

function valueAt(series: ChartSeries, index: number): number {
  return Math.max(0, series.values[index] ?? 0);
}

function labelText(category: ChartCategory, narrow: boolean): string {
  return narrow ? (category.shortLabel ?? category.label) : category.label;
}

function columnAt(
  clientX: number,
  left: number,
  layout: ChartLayout,
  columns: number,
): number | null {
  const x = clientX - left;
  if (x < layout.groupLeft) return null;
  const pitch = layout.barWidth + layout.barGap;
  const index = Math.floor((x - layout.firstBarX + layout.barGap / 2) / pitch);
  return Math.min(columns - 1, Math.max(0, index));
}

/**
 * Stacked bar chart drawn in SVG. The drawing is hidden from assistive
 * technology and the legend is an HTML list: the data is read from the table
 * that accompanies the chart.
 */
export function StackedBarChart({
  categories,
  series,
  labelledBy,
  height = 358,
  narrowHeight = 220,
  tooltipExtra,
}: StackedBarChartProps) {
  const clipPrefix = useId().replace(/\W/g, '');
  const [plotRef, width] = useElementWidth<HTMLDivElement>();
  const [pointed, setPointed] = useState<number | null>(null);
  // The column whose tooltip Escape dismissed (WCAG 1.4.13 Dismissible).
  const [dismissed, setDismissed] = useState<number | null>(null);
  const active = pointed === dismissed ? null : pointed;

  const columns = categories.length;
  const layout = computeLayout({
    width,
    columns,
    height,
    narrowHeight,
  });
  const totals = categories.map((_, index) =>
    series.reduce((sum, item) => sum + valueAt(item, index), 0),
  );
  const scale = niceScale(Math.max(0, ...totals));
  const unit = layout.gridHeight / scale.max;
  const gridBottom = layout.gridTop + layout.gridHeight;
  const barX = (index: number) =>
    layout.firstBarX + index * (layout.barWidth + layout.barGap);

  // Escape works wherever focus is: the tooltip is pointer-only, so focus is
  // never inside the chart. It is not consumed, so other handlers still run.
  const tooltipShown = active !== null;
  useEffect(() => {
    if (!tooltipShown) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setDismissed(pointed);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [tooltipShown, pointed]);

  const { placements: xLabels } = planXLabels({
    items: categories.map((category, index) => {
      const caption = layout.narrow ? category.shortCaption : undefined;
      return {
        // The caption is on a line of its own, so only the label can collide.
        width: estimateTextWidth(labelText(category, layout.narrow)),
        // A year caption pins the first and last label to the chart's edges.
        anchor:
          caption === undefined
            ? 'middle'
            : index === 0
              ? 'start'
              : index === columns - 1
                ? 'end'
                : 'middle',
      };
    }),
    barX,
    barWidth: layout.barWidth,
    chartWidth: width,
  });

  const flipped =
    active !== null &&
    barX(active) + layout.barWidth / 2 > (width + layout.groupLeft) / 2;

  function track(event: PointerEvent<HTMLDivElement>) {
    // The tooltip sits inside the plot so the pointer can travel onto it
    // (WCAG 1.4.13 Hoverable); over it, the column under it does not count.
    if (
      event.target instanceof Element &&
      event.target.closest('[data-slot="tooltip"]')
    ) {
      return;
    }
    const { left } = event.currentTarget.getBoundingClientRect();
    const column = columnAt(event.clientX, left, layout, columns);
    // The tooltip stands TOOLTIP_OFFSET from its bar. On a narrow chart a
    // column's own zone, half the bar gap, is shorter than that, so the strip
    // between bar and tooltip belongs to the active column too; otherwise the
    // pointer would cross the neighbours' columns on its way to the tooltip.
    if (active !== null && column !== active) {
      const x = event.clientX - left;
      const start = barX(active);
      const end = start + layout.barWidth;
      const inStrip = flipped
        ? x >= start - TOOLTIP_OFFSET && x < start
        : x >= end && x <= end + TOOLTIP_OFFSET;
      if (inStrip) return;
    }
    setPointed(column);
    // Moving to another column ends a dismissal.
    if (column !== dismissed) setDismissed(null);
  }

  function leave() {
    setPointed(null);
    setDismissed(null);
  }

  const activeCategory = active === null ? undefined : categories[active];
  const extras = active === null || !tooltipExtra ? [] : tooltipExtra(active);
  const tooltipPosition =
    active === null
      ? null
      : flipped
        ? { right: width - barX(active) + TOOLTIP_OFFSET }
        : { left: barX(active) + layout.barWidth + TOOLTIP_OFFSET };

  return (
    <div className={styles.chart}>
      <div
        ref={plotRef}
        className={styles.plot}
        style={{ height: layout.plotHeight }}
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={leave}
      >
        {width > 0 && (
          <svg
            role="img"
            aria-labelledby={labelledBy}
            width={width}
            height={layout.plotHeight}
            viewBox={`0 0 ${String(width)} ${String(layout.plotHeight)}`}
          >
            <g aria-hidden="true">
              <defs>
                {categories.map((category, index) => (
                  <clipPath
                    key={category.label}
                    id={`${clipPrefix}-${String(index)}`}
                  >
                    <rect
                      className={styles.clipShape}
                      x={barX(index)}
                      y={gridBottom - (totals[index] ?? 0) * unit}
                      width={layout.barWidth}
                      height={(totals[index] ?? 0) * unit}
                    />
                  </clipPath>
                ))}
              </defs>

              {scale.ticks.map((tick, index) => {
                const y = gridBottom - index * (layout.gridHeight / 4);
                return (
                  <g key={tick}>
                    <line
                      className={styles.gridLine}
                      x1={layout.groupLeft}
                      x2={width}
                      y1={y}
                      y2={y}
                    />
                    <text
                      className={styles.axisText}
                      x={layout.axisWidth}
                      y={y + 4}
                      textAnchor="end"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {active !== null && (
                <rect
                  className={styles.band}
                  x={barX(active) - layout.barGap / 2}
                  y={layout.gridTop}
                  width={layout.barWidth + layout.barGap}
                  height={layout.gridHeight}
                />
              )}

              {categories.map((category, index) => {
                let top = gridBottom;
                return (
                  <g
                    key={category.label}
                    data-category={index}
                    clipPath={`url(#${clipPrefix}-${String(index)})`}
                  >
                    {series.map((item, position) => {
                      const value = valueAt(item, index);
                      if (value === 0) return null;
                      const segmentHeight = value * unit;
                      top -= segmentHeight;
                      return (
                        <rect
                          key={item.id}
                          data-series={item.id}
                          x={barX(index)}
                          y={top}
                          width={layout.barWidth}
                          height={segmentHeight}
                          style={{
                            fill: chartColor(item.colorIndex ?? position),
                          }}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {xLabels.map(({ index, x, anchor }) => {
                const category = categories[index];
                if (!category) return null;
                const caption = layout.narrow
                  ? category.shortCaption
                  : undefined;
                // The baseline of a 16px footnote line sits about 12px down.
                const baseline = layout.labelTop + 12;
                return (
                  <g key={category.label}>
                    <text
                      className={styles.axisText}
                      x={x}
                      y={baseline}
                      textAnchor={anchor}
                    >
                      {labelText(category, layout.narrow)}
                    </text>
                    {caption !== undefined && (
                      <text
                        className={styles.axisText}
                        x={x}
                        y={baseline + layout.labelLineHeight}
                        textAnchor={anchor}
                      >
                        {caption}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {activeCategory && tooltipPosition && (
          <div
            data-slot="tooltip"
            aria-hidden="true"
            className={styles.tooltip}
            style={{ top: layout.gridTop, ...tooltipPosition }}
          >
            <div className={styles.tooltipTitle}>{activeCategory.label}</div>
            {series.map((item, position) => (
              <div key={item.id} data-slot="line" className={styles.line}>
                <span
                  className={styles.swatch}
                  style={{
                    backgroundColor: chartColor(item.colorIndex ?? position),
                  }}
                />
                <span>{item.name}</span>
                <span className={styles.value}>
                  {valueAt(item, active ?? 0)}
                </span>
              </div>
            ))}
            {extras.length > 0 && (
              <div data-slot="divider" className={styles.divider} />
            )}
            {extras.map((extra) => (
              <div key={extra.label} data-slot="line" className={styles.line}>
                <span>{extra.label}</span>
                <span className={styles.value}>{extra.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ul className={styles.legend}>
        {series.map((item, position) => (
          <li key={item.id} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={{
                backgroundColor: chartColor(item.colorIndex ?? position),
              }}
            />
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
