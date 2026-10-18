// Measurements from docs/DESIGN.md that code (not CSS) needs. Mirrors
// _geometry.scss; change both together.

export const NARROW_CHART_WIDTH = 760;

export const CHART = {
  plotHeight: 358,
  narrowPlotHeight: 220,
  axisWidth: 26,
  narrowAxisWidth: 24,
  /** Space between the axis column and the first bar group. */
  axisGap: 12,
  narrowAxisGap: 4,
  top: 10,
  gridLines: 5,
  gridHeight: 320,
  barGap: 24,
  narrowBarGap: 4,
  /** Padding at both ends of the bar row. */
  barRowPadding: 12,
  labelGap: 12,
  labelLineHeight: 16,
} as const;
