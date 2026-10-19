import { describe, expect, it } from 'vitest';
import { estimateTextWidth, planXLabels, type XLabelItem } from './axisLabels';
import { computeLayout } from './layout';

// Widths measured in Chromium with the Inter footnote style under the WCAG
// text-spacing styles (letter-spacing 0.12em, word-spacing 0.16em): the widest
// "MMM YYYY" label is "May 2024", the widest "MMM" label is "May".
const MEASURED_LONG = 70.73;
const MEASURED_SHORT = 28.47;

function plan(chartWidth: number, measured: { long: number; short: number }) {
  const layout = computeLayout({
    width: chartWidth,
    columns: 12,
    height: 358,
    narrowHeight: 220,
  });
  const items: XLabelItem[] = Array.from({ length: 12 }, (_, index) => {
    const captioned = layout.narrow && (index === 0 || index === 11);
    return {
      width: layout.narrow ? measured.short : measured.long,
      anchor: captioned ? (index === 0 ? 'start' : 'end') : 'middle',
    };
  });
  const pitch = layout.barWidth + layout.barGap;
  return planXLabels({
    items,
    barX: (index) => layout.firstBarX + index * pitch,
    barWidth: layout.barWidth,
    chartWidth,
  });
}

describe('estimateTextWidth', () => {
  it('budgets 0.68em a character plus 0.12em letter spacing and 0.16em a space, at 12px', () => {
    // 3 characters * 0.8em * 12px.
    expect(estimateTextWidth('May')).toBeCloseTo(28.8, 5);
    // 8 characters * 0.8em + 1 space * 0.16em, * 12px.
    expect(estimateTextWidth('May 2024')).toBeCloseTo(78.72, 5);
    expect(estimateTextWidth('')).toBe(0);
  });

  it('stays above what Chromium measures with the text-spacing styles applied', () => {
    expect(estimateTextWidth('May 2024')).toBeGreaterThan(MEASURED_LONG);
    expect(estimateTextWidth('May')).toBeGreaterThan(MEASURED_SHORT);
  });
});

describe('planXLabels', () => {
  it('labels every column when they all fit with headroom', () => {
    const { stride, placements } = plan(1376, {
      long: estimateTextWidth('May 2024'),
      short: estimateTextWidth('May'),
    });
    expect(stride).toBe(1);
    expect(placements.map((placement) => placement.index)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it('labels every second month, counted back from the last, when they do not fit', () => {
    // 264px is the chart of a 320px viewport: 20px columns for "May" at 28.8px.
    const { stride, placements } = plan(264, {
      long: estimateTextWidth('May 2024'),
      short: estimateTextWidth('May'),
    });
    expect(stride).toBe(2);
    expect(placements.map((placement) => placement.index)).toEqual([
      1, 3, 5, 7, 9, 11,
    ]);
  });

  it('thins the wide labels just above the narrow breakpoint', () => {
    // 760px: 60.2px columns for "May 2024" at 78.7px.
    const { stride } = plan(760, {
      long: estimateTextWidth('May 2024'),
      short: estimateTextWidth('May'),
    });
    expect(stride).toBe(2);
  });

  it('never overlaps two labels or leaves the chart, from a 320px viewport up, with text spacing', () => {
    // 264px is the narrowest chart (320px viewport less 24px page and 32px card
    // padding). Real widths of the spaced text, not the estimate.
    for (let width = 264; width <= 1700; width += 1) {
      const { placements } = plan(width, {
        long: MEASURED_LONG,
        short: MEASURED_SHORT,
      });
      expect(placements.length, `labels at ${String(width)}px`).toBeGreaterThan(
        1,
      );
      for (const [position, current] of placements.entries()) {
        expect(
          current.left,
          `left edge at ${String(width)}px`,
        ).toBeGreaterThanOrEqual(0);
        expect(
          current.right,
          `right edge at ${String(width)}px`,
        ).toBeLessThanOrEqual(width);
        const next = placements[position + 1];
        if (next) {
          expect(
            next.left - current.right,
            `gap at ${String(width)}px`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps the last month and anchors the edge labels to the chart edge', () => {
    const { placements } = plan(264, {
      long: estimateTextWidth('May 2024'),
      short: estimateTextWidth('May'),
    });
    const last = placements.at(-1);
    expect(last?.index).toBe(11);
    expect(last?.anchor).toBe('end');
    expect(last?.x).toBe(264);
  });

  it('moves a centred label that would leave the chart to the edge', () => {
    const { placements } = planXLabels({
      items: [
        { width: 40, anchor: 'middle' },
        { width: 40, anchor: 'middle' },
      ],
      barX: (index) => index * 100,
      barWidth: 10,
      chartWidth: 120,
    });
    expect(placements[0]).toMatchObject({ anchor: 'start', x: 0, left: 0 });
    expect(placements[1]).toMatchObject({ anchor: 'end', x: 120, right: 120 });
  });
});
