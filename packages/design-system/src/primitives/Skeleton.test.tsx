import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '#test-support/axe';
import { describe, expect, it } from 'vitest';
import { Skeleton } from '#primitives';

describe('Skeleton', () => {
  it('draws the chart card with axes and 12 empty bar slots, hidden from assistive technology', async () => {
    const { container } = render(<Skeleton variant="chart" />);
    expect(container.querySelectorAll('[data-slot="bar"]')).toHaveLength(12);
    expect(container.querySelectorAll('[data-slot="y-label"]')).toHaveLength(5);
    expect(container.querySelectorAll('[data-slot="x-label"]')).toHaveLength(
      12,
    );
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('reserves the room of a footnote under the legend, hidden from everyone', () => {
    const { container } = render(
      <Skeleton
        variant="chart"
        footnote="A note that wraps on narrow screens."
      />,
    );
    const note = screen.getByText('A note that wraps on narrow screens.');
    expect(note.closest('[aria-hidden="true"]')).toBe(
      container.firstElementChild,
    );
    const legend = container.querySelector('[data-slot="legend"]');
    expect(legend?.nextElementSibling).toBe(note);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('draws no footnote by default', () => {
    const { container } = render(<Skeleton variant="chart" />);
    expect(container.querySelector('[data-slot="footnote"]')).toBeNull();
  });

  it('draws the table card with a header and four rows by default', async () => {
    const { container } = render(<Skeleton variant="table" />);
    expect(container.querySelectorAll('[data-slot="header-row"]')).toHaveLength(
      1,
    );
    expect(container.querySelectorAll('[data-slot="row"]')).toHaveLength(4);
    await expectNoAxeViolations(container);
  });

  it('draws the requested number of table rows', () => {
    const { container } = render(<Skeleton variant="table" rows={2} />);
    expect(container.querySelectorAll('[data-slot="row"]')).toHaveLength(2);
  });
});
