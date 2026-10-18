import { CHART, NARROW_CHART_WIDTH } from '#tokens';

export interface ChartLayout {
  narrow: boolean;
  /** Total height of the plot, x labels included. */
  plotHeight: number;
  axisWidth: number;
  /** Where the bar group starts, from the left edge of the plot. */
  groupLeft: number;
  gridTop: number;
  gridHeight: number;
  barWidth: number;
  barGap: number;
  /** Left edge of the first bar. */
  firstBarX: number;
  labelTop: number;
  labelLineHeight: number;
}

export interface LayoutInput {
  /** Measured width of the chart. */
  width: number;
  columns: number;
  /** Plot height at full width. */
  height: number;
  /** Plot height on a narrow chart. */
  narrowHeight: number;
}

/**
 * Geometry of the plot from the measured width (DESIGN.md "Chart card",
 * "Narrow screens"). Below NARROW_CHART_WIDTH the 12 full labels no longer fit,
 * so the chart switches to short labels, a shorter plot and tight gaps.
 */
export function computeLayout({
  width,
  columns,
  height,
  narrowHeight,
}: LayoutInput): ChartLayout {
  const narrow = width < NARROW_CHART_WIDTH;
  const axisWidth = narrow ? CHART.narrowAxisWidth : CHART.axisWidth;
  const groupLeft = axisWidth + (narrow ? CHART.narrowAxisGap : CHART.axisGap);
  const barGap = narrow ? CHART.narrowBarGap : CHART.barGap;
  const padding = narrow ? 0 : CHART.barRowPadding;
  const labelLines = narrow ? 2 : 1;
  const plotHeight = narrow ? narrowHeight : height;
  const labelBlock = labelLines * CHART.labelLineHeight;
  const gridHeight = Math.max(
    0,
    plotHeight - CHART.top - CHART.labelGap - labelBlock,
  );
  const barRow = width - groupLeft - 2 * padding - (columns - 1) * barGap;

  return {
    narrow,
    plotHeight,
    axisWidth,
    groupLeft,
    gridTop: CHART.top,
    gridHeight,
    barWidth: Math.max(1, barRow / columns),
    barGap,
    firstBarX: groupLeft + padding,
    labelTop: CHART.top + gridHeight + CHART.labelGap,
    labelLineHeight: CHART.labelLineHeight,
  };
}
