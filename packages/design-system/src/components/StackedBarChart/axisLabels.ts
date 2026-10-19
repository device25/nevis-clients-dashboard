import { CHART } from '#tokens';

export type LabelAnchor = 'start' | 'middle' | 'end';

/**
 * Width budget of a footnote-style label, in em. Inter's widest glyphs
 * ("M", digits) average 0.67em; 0.68em is the budget. The label is also given
 * the room that WCAG 2.2 SC 1.4.12 Text Spacing adds when a user applies it:
 * letter-spacing 0.12em on every character and word-spacing 0.16em on every
 * space. Measured in Chromium, "May 2024" is 57.3px plain and 70.7px spaced;
 * the budget gives 78.7px.
 */
const GLYPH_EM = 0.68;
const LETTER_SPACING_EM = 0.12;
const WORD_SPACING_EM = 0.16;

/** Space kept free between two neighbouring labels, in px. */
export const LABEL_GAP = 4;

/** Upper bound of the width of `text` in the footnote style, spaced by the user. */
export function estimateTextWidth(text: string): number {
  const characters = Array.from(text);
  const spaces = characters.filter((character) => character === ' ').length;
  return (
    (characters.length * (GLYPH_EM + LETTER_SPACING_EM) +
      spaces * WORD_SPACING_EM) *
    CHART.labelFontSize
  );
}

export interface XLabelItem {
  /** Width of the widest line of the label, see `estimateTextWidth`. */
  width: number;
  /** `start` and `end` pin the label to the left or right edge of its bar. */
  anchor: LabelAnchor;
}

export interface XLabelPlacement {
  index: number;
  x: number;
  anchor: LabelAnchor;
  left: number;
  right: number;
}

export interface XLabelPlanInput {
  items: readonly XLabelItem[];
  barX: (index: number) => number;
  barWidth: number;
  chartWidth: number;
}

function place(
  { items, barX, barWidth, chartWidth }: XLabelPlanInput,
  index: number,
): XLabelPlacement {
  const { width, anchor } = items[index] ?? { width: 0, anchor: 'middle' };
  const box = (kind: LabelAnchor, x: number) => ({
    index,
    x,
    anchor: kind,
    left: kind === 'start' ? x : kind === 'end' ? x - width : x - width / 2,
    right: kind === 'start' ? x + width : kind === 'end' ? x : x + width / 2,
  });
  const wanted = box(
    anchor,
    anchor === 'start'
      ? barX(index)
      : anchor === 'end'
        ? barX(index) + barWidth
        : barX(index) + barWidth / 2,
  );
  // A label that would stick out of the chart is clipped by the svg, so it
  // moves to the edge instead.
  if (wanted.left < 0) return box('start', 0);
  if (wanted.right > chartWidth) return box('end', chartWidth);
  return wanted;
}

/**
 * Chooses which month labels to draw so that none overlaps another and none
 * leaves the chart, at any width and with the text-spacing styles applied.
 *
 * Rule: every label when all of them fit with LABEL_GAP between neighbours;
 * otherwise every second one, then every third, and so on, always counting
 * back from the last column so the most recent month is named. The table and
 * the tooltip still carry every month. Each label's room is its estimated
 * width (`estimateTextWidth`), measured from where its anchor puts it.
 */
export function planXLabels(input: XLabelPlanInput): {
  stride: number;
  placements: XLabelPlacement[];
} {
  const columns = input.items.length;
  let placements: XLabelPlacement[] = [];
  for (let stride = 1; stride <= Math.max(1, columns - 1); stride += 1) {
    placements = [];
    for (let index = columns - 1; index >= 0; index -= stride) {
      placements.unshift(place(input, index));
    }
    const fits = placements.every((current, position) => {
      const next = placements[position + 1];
      return !next || next.left - current.right >= LABEL_GAP;
    });
    if (fits) return { stride, placements };
  }
  return { stride: Math.max(1, columns - 1), placements };
}
