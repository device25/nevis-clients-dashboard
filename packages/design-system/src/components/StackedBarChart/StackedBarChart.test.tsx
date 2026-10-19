import { fireEvent, render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '#test-support/axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StackedBarChart } from '#components';

// Twelve months, Feb 2024 to Jan 2025, as a generic category list.
const NAMES = [
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
];
const categories = NAMES.map((name, index) => {
  const year = index === 11 ? '2025' : '2024';
  return {
    label: `${name} ${year}`,
    shortLabel: name,
    ...(index === 0 || index === 11 ? { shortCaption: year } : {}),
  };
});

const alpha = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 200];
const beta = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 148];
const gamma = [0, 0, 1, 2, 1, 0, 2, 1, 1, 1, 1, 2];
// Stack totals: 150, 160, 171, 182, 191, 200, 212, 221, 231, 241, 251, 350.
const series = [
  { id: 'alpha', name: 'Alpha', values: alpha },
  { id: 'beta', name: 'Beta', values: beta },
  { id: 'gamma', name: 'Gamma', values: gamma },
];

let measuredWidth = 1376;

beforeEach(() => {
  measuredWidth = 1376;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ target, contentRect: { width: measuredWidth } } as never],
          this,
        );
      }
      unobserve() {
        // Nothing to release: the stub never fires again.
      }
      disconnect() {
        // Nothing to release: the stub never fires again.
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderChart(
  props: Partial<Parameters<typeof StackedBarChart>[0]> = {},
) {
  return render(
    <>
      <p id="chart-name">Company, by branch, Feb 2024 to Jan 2025</p>
      <StackedBarChart
        categories={categories}
        series={series}
        labelledBy="chart-name"
        {...props}
      />
    </>,
  );
}

function segments(container: HTMLElement, category: number): SVGRectElement[] {
  const bar = container.querySelector(
    `svg [data-category="${String(category)}"]`,
  );
  return bar ? Array.from(bar.querySelectorAll('rect[data-series]')) : [];
}

function number(element: Element, attribute: string): number {
  return Number(element.getAttribute(attribute));
}

// Column i of the 1376px chart starts at 38 + 12 + i * 111.5 and is 87.5 wide.
function columnCentre(index: number): number {
  return 50 + index * 111.5 + 43.75;
}

function hover(container: HTMLElement, clientX: number) {
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('no svg');
  fireEvent.pointerMove(svg, { clientX, clientY: 100 });
}

function tooltip(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="tooltip"]');
}

function lines(root: HTMLElement | null): string[] {
  if (!root) throw new Error('no tooltip');
  return Array.from(root.querySelectorAll('[data-slot="line"]')).map((line) =>
    Array.from(line.children)
      .map((child) => child.textContent)
      .filter((text) => text !== '')
      .join(' '),
  );
}

describe('StackedBarChart', () => {
  it('is an image named by the element it points to, with everything inside hidden', async () => {
    const { container } = renderChart();
    expect(
      screen.getByRole('img', {
        name: 'Company, by branch, Feb 2024 to Jan 2025',
      }),
    ).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg?.children.length).toBeGreaterThan(0);
    for (const child of Array.from(svg?.children ?? [])) {
      expect(child).toHaveAttribute('aria-hidden', 'true');
    }
    await expectNoAxeViolations(container);
  });

  it('draws 12 bars', () => {
    const { container } = renderChart();
    expect(container.querySelectorAll('svg [data-category]')).toHaveLength(12);
  });

  it('draws one segment per non-zero value and none for zeros', () => {
    const { container } = renderChart();
    expect(container.querySelectorAll('svg rect[data-series]')).toHaveLength(
      33,
    );
    expect(segments(container, 0)).toHaveLength(2);
    expect(segments(container, 5)).toHaveLength(2);
    expect(segments(container, 11)).toHaveLength(3);
  });

  it('sizes segments in proportion to their values on the 0 to 400 scale', () => {
    const { container } = renderChart();
    // 320px of grid for 400: 0.8px per client. Series stack bottom to top.
    const [bottom, middle, top] = segments(container, 11);
    expect(number(bottom as Element, 'height')).toBeCloseTo(160, 2);
    expect(number(middle as Element, 'height')).toBeCloseTo(118.4, 2);
    expect(number(top as Element, 'height')).toBeCloseTo(1.6, 2);
    // The grid spans y = 10 to 330, so the stack tops out at 330 - 280 = 50.
    expect(number(bottom as Element, 'y')).toBeCloseTo(170, 2);
    expect(number(top as Element, 'y')).toBeCloseTo(50, 2);
  });

  it('puts 87.5px bars 24px apart', () => {
    const { container } = renderChart();
    const first = segments(container, 0)[0] as Element;
    const second = segments(container, 1)[0] as Element;
    expect(number(first, 'x')).toBeCloseTo(50, 2);
    expect(number(first, 'width')).toBeCloseTo(87.5, 2);
    expect(number(second, 'x')).toBeCloseTo(161.5, 2);
  });

  it('labels the y axis from 0 to the nice maximum and each column with its full label', () => {
    const { container } = renderChart();
    const labels = Array.from(container.querySelectorAll('svg text')).map(
      (text) => text.textContent,
    );
    expect(labels.slice(0, 5)).toEqual(['0', '100', '200', '300', '400']);
    expect(labels.slice(5)).toEqual(
      categories.map((category) => category.label),
    );
  });

  it('is 358px tall at full width', () => {
    const { container } = renderChart();
    expect(container.querySelector('svg')).toHaveAttribute('height', '358');
  });

  it('colours series by position, or by the index they are given', () => {
    const { container } = renderChart({
      series: [{ id: 'only', name: 'Only', values: beta, colorIndex: 1 }],
    });
    const segment = segments(container, 0)[0] as SVGElement;
    expect(segment.style.fill).toBe('var(--color-chart-2)');
    const { container: other } = renderChart();
    const third = segments(other, 11)[2] as SVGElement;
    expect(third.style.fill).toBe('var(--color-chart-3)');
  });

  it('lists the series in order in an HTML legend outside the svg', () => {
    const { container } = renderChart();
    const list = screen.getByRole('list');
    expect(list.closest('svg')).toBeNull();
    expect(container.querySelector('svg')).not.toContainElement(list);
    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('shows one line per series, zeros included, and the extra lines after a divider on hover', () => {
    const { container } = renderChart({
      tooltipExtra: (index) => [
        { label: 'Children total', value: index === 0 ? 150 : 0 },
        { label: 'Reported total', value: 151 },
      ],
    });
    expect(tooltip(container)).toBeNull();
    hover(container, columnCentre(0));
    const shown = tooltip(container);
    expect(shown).not.toBeNull();
    expect(shown).toHaveTextContent('Feb 2024');
    expect(lines(shown)).toEqual([
      'Alpha 100',
      'Beta 50',
      'Gamma 0',
      'Children total 150',
      'Reported total 151',
    ]);
    expect(shown?.querySelector('[data-slot="divider"]')).toBeInTheDocument();
  });

  it('follows the pointer between columns and hides when it leaves', () => {
    const { container } = renderChart();
    hover(container, columnCentre(3));
    expect(tooltip(container)).toHaveTextContent('May 2024');
    hover(container, columnCentre(4));
    expect(tooltip(container)).toHaveTextContent('Jun 2024');
    const svg = container.querySelector('svg');
    if (!svg) throw new Error('no svg');
    fireEvent.pointerLeave(svg);
    expect(tooltip(container)).toBeNull();
  });

  it('hides the tooltip on Escape, leaves focus alone, and shows it again on another column', () => {
    const { container } = renderChart();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    hover(container, columnCentre(3));
    expect(tooltip(container)).toHaveTextContent('May 2024');
    fireEvent.keyDown(outside, { key: 'Escape' });
    expect(tooltip(container)).toBeNull();
    expect(outside).toHaveFocus();
    // Still over May: stays hidden.
    hover(container, columnCentre(3) + 5);
    expect(tooltip(container)).toBeNull();
    hover(container, columnCentre(4));
    expect(tooltip(container)).toHaveTextContent('Jun 2024');
    outside.remove();
  });

  it('shows a dismissed column again after the pointer leaves and comes back', () => {
    const { container } = renderChart();
    hover(container, columnCentre(3));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(tooltip(container)).toBeNull();
    const svg = container.querySelector('svg');
    if (!svg) throw new Error('no svg');
    fireEvent.pointerLeave(svg);
    hover(container, columnCentre(3));
    expect(tooltip(container)).toHaveTextContent('May 2024');
  });

  it('keeps the tooltip, and its month, while the pointer moves onto it', () => {
    const { container } = renderChart();
    hover(container, columnCentre(3));
    const shown = tooltip(container);
    const svg = container.querySelector('svg');
    if (!shown || !svg) throw new Error('missing tooltip or svg');
    // The pointer leaves the drawing for the tooltip, then moves over it at
    // an x that lies above the next column.
    fireEvent.pointerOut(svg, { relatedTarget: shown });
    fireEvent.pointerMove(shown, { clientX: columnCentre(4), clientY: 100 });
    expect(tooltip(container)).toBe(shown);
    expect(shown).toHaveTextContent('May 2024');
    const outside = document.createElement('button');
    document.body.append(outside);
    fireEvent.pointerOut(shown, { relatedTarget: outside });
    expect(tooltip(container)).toBeNull();
    outside.remove();
  });

  it('omits the divider when there are no extra lines', () => {
    const { container } = renderChart();
    hover(container, columnCentre(0));
    expect(
      tooltip(container)?.querySelector('[data-slot="divider"]'),
    ).toBeNull();
  });

  it('puts the tooltip right of the column in the left half and left of it in the right half', () => {
    const { container } = renderChart();
    hover(container, columnCentre(1));
    expect(tooltip(container)?.style.left).not.toBe('');
    expect(tooltip(container)?.style.right).toBe('');
    hover(container, columnCentre(10));
    expect(tooltip(container)?.style.right).not.toBe('');
    expect(tooltip(container)?.style.left).toBe('');
  });

  describe('on a narrow chart', () => {
    beforeEach(() => {
      measuredWidth = 319;
    });

    it('uses the short height, 24px axis and 4px gaps', () => {
      const { container } = renderChart();
      expect(container.querySelector('svg')).toHaveAttribute('height', '220');
      const first = segments(container, 0)[0] as Element;
      const second = segments(container, 1)[0] as Element;
      expect(number(first, 'x')).toBeCloseTo(28, 2);
      // (319 - 28 - 11 * 4) / 12 wide, then a 4px gap.
      expect(number(first, 'width')).toBeCloseTo(20.5833, 3);
      expect(number(second, 'x')).toBeCloseTo(28 + 20.5833 + 4, 3);
      // Grid height 220 - 10 - 12 - 32 = 166 for 400 clients.
      expect(number(first, 'height')).toBeCloseTo(41.5, 2);
    });

    it('shows month names only, with the year under the first and last column, when they fit', () => {
      measuredWidth = 600;
      const { container } = renderChart();
      const labels = Array.from(container.querySelectorAll('svg text')).map(
        (text) => text.textContent,
      );
      expect(labels.slice(5)).toEqual([
        'Feb',
        '2024',
        ...NAMES.slice(1, 11),
        'Jan',
        '2025',
      ]);
    });

    it('labels every second month, counted back from the last, when they would overlap', () => {
      const { container } = renderChart();
      const labels = Array.from(container.querySelectorAll('svg text')).map(
        (text) => text.textContent,
      );
      expect(labels.slice(5)).toEqual([
        'Mar',
        'May',
        'Jul',
        'Sep',
        'Nov',
        'Jan',
        '2025',
      ]);
    });
  });

  it('still labels every second month on the chart of a 320px viewport, year caption included', () => {
    measuredWidth = 264;
    const { container } = renderChart();
    const labels = Array.from(container.querySelectorAll('svg text')).map(
      (text) => text.textContent,
    );
    expect(labels.slice(5)).toEqual([
      'Mar',
      'May',
      'Jul',
      'Sep',
      'Nov',
      'Jan',
      '2025',
    ]);
  });

  it('labels every second month on a wide chart too narrow for twelve spaced labels', () => {
    measuredWidth = 800;
    const { container } = renderChart();
    const labels = Array.from(container.querySelectorAll('svg text')).map(
      (text) => text.textContent,
    );
    expect(labels.slice(5)).toEqual([
      'Mar 2024',
      'May 2024',
      'Jul 2024',
      'Sep 2024',
      'Nov 2024',
      'Jan 2025',
    ]);
  });

  it('draws nothing but the legend before it has a width', () => {
    measuredWidth = 0;
    const { container } = renderChart();
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders a scope with a single series and a scope with all zeros', async () => {
    const { container } = renderChart({
      series: [
        { id: 'z', name: 'Zero', values: new Array<number>(12).fill(0) },
      ],
    });
    expect(container.querySelectorAll('svg rect[data-series]')).toHaveLength(0);
    await expectNoAxeViolations(container);
  });
});
