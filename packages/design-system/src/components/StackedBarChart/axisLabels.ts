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
  /** Width of the label's first line, see `estimateTextWidth`. */
  width: number;
  /** `start` and `end` pin the label to the left or right edge of its bar. */
  anchor: LabelAnchor;
  /** Width of the caption line under the label, if the category has one. */
  captionWidth?: number;
}

export interface XCaptionPlacement {
  /** Index of the category whose caption this is. */
  index: number;
  x: number;
  anchor: LabelAnchor;
  left: number;
  right: number;
}

export interface XLabelPlacement {
  index: number;
  x: number;
  anchor: LabelAnchor;
  left: number;
  right: number;
  /** The second line under the label, when it carries a caption. */
  caption?: XCaptionPlacement;
}

export interface XLabelPlanInput {
  items: readonly XLabelItem[];
  barX: (index: number) => number;
  barWidth: number;
  chartWidth: number;
}

function boxAt(kind: LabelAnchor, x: number, width: number) {
  return {
    x,
    anchor: kind,
    left: kind === 'start' ? x : kind === 'end' ? x - width : x - width / 2,
    right: kind === 'start' ? x + width : kind === 'end' ? x : x + width / 2,
  };
}

/** The box, or the same box moved to the nearer edge when it would leave the chart. */
function insideChart(
  kind: LabelAnchor,
  x: number,
  width: number,
  chartWidth: number,
) {
  // Text that sticks out of the chart is clipped by the svg.
  const wanted = boxAt(kind, x, width);
  if (wanted.left < 0) return boxAt('start', 0, width);
  if (wanted.right > chartWidth) return boxAt('end', chartWidth, width);
  return wanted;
}

function place(
  { items, barX, barWidth, chartWidth }: XLabelPlanInput,
  index: number,
): XLabelPlacement {
  const { width, anchor } = items[index] ?? { width: 0, anchor: 'middle' };
  const x =
    anchor === 'start'
      ? barX(index)
      : anchor === 'end'
        ? barX(index) + barWidth
        : barX(index) + barWidth / 2;
  return { index, ...insideChart(anchor, x, width, chartWidth) };
}

/**
 * Gives every caption a label to sit under. A caption stays under its own
 * label when that is drawn. Otherwise it moves to the nearest drawn label that
 * has no caption, so the first year is not lost when its month is dropped.
 * A caption that has nowhere to go, or would come within LABEL_GAP of another
 * caption, is left out.
 */
function placeCaptions(
  { items, chartWidth }: XLabelPlanInput,
  placements: XLabelPlacement[],
): void {
  const taken: XCaptionPlacement[] = [];
  const attach = (host: XLabelPlacement, index: number): boolean => {
    const width = items[index]?.captionWidth ?? 0;
    const box = insideChart(host.anchor, host.x, width, chartWidth);
    const collides = taken.some(
      (other) =>
        box.left - other.right < LABEL_GAP &&
        other.left - box.right < LABEL_GAP,
    );
    if (collides) return false;
    const caption = { index, ...box };
    host.caption = caption;
    taken.push(caption);
    return true;
  };

  const captioned = items.flatMap((item, index) =>
    item.captionWidth === undefined ? [] : [index],
  );
  const own = captioned.filter((index) =>
    placements.some((placement) => placement.index === index),
  );
  for (const index of own) {
    const host = placements.find((placement) => placement.index === index);
    if (host) attach(host, index);
  }
  for (const index of captioned) {
    if (own.includes(index)) continue;
    const hosts = placements
      .filter((placement) => placement.caption === undefined)
      .sort(
        (a, b) =>
          Math.abs(a.index - index) - Math.abs(b.index - index) ||
          b.index - a.index,
      );
    const host = hosts[0];
    if (host) attach(host, index);
  }
}

/**
 * Chooses which month labels to draw so that none overlaps another and none
 * leaves the chart, at any width and with the text-spacing styles applied.
 *
 * Rule: every label when all of them fit with LABEL_GAP between neighbours;
 * otherwise every second one, then every third, and so on, always counting
 * back from the last column so the most recent month is named. The table and
 * the tooltip still carry every month. Each label's room is its estimated
 * width (`estimateTextWidth`), measured from where its anchor puts it. Year
 * captions follow `placeCaptions`.
 */
export function planXLabels(input: XLabelPlanInput): {
  stride: number;
  placements: XLabelPlacement[];
} {
  const columns = input.items.length;
  let placements: XLabelPlacement[] = [];
  // A stride of `columns` draws the last label alone, which always fits.
  for (let stride = 1; stride <= Math.max(1, columns); stride += 1) {
    placements = [];
    for (let index = columns - 1; index >= 0; index -= stride) {
      placements.unshift(place(input, index));
    }
    const fits = placements.every((current, position) => {
      const next = placements[position + 1];
      return !next || next.left - current.right >= LABEL_GAP;
    });
    if (fits) {
      placeCaptions(input, placements);
      return { stride, placements };
    }
  }
  return { stride: Math.max(1, columns), placements };
}
