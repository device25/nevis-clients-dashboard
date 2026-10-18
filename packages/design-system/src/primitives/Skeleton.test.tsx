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
