import { render } from '@testing-library/react';
import { expectNoAxeViolations } from '#test-support/axe';
import { describe, expect, it } from 'vitest';
import { Chevron, StatusDot } from '#primitives';

describe('Chevron', () => {
  it('is decorative and reports whether it points down', async () => {
    const { container, rerender } = render(<Chevron expanded={false} />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('data-expanded', 'false');
    rerender(<Chevron expanded />);
    expect(container.querySelector('svg')).toHaveAttribute(
      'data-expanded',
      'true',
    );
    await expectNoAxeViolations(container);
  });
});

describe('StatusDot', () => {
  it('is decorative', async () => {
    const { container } = render(
      <p>
        <StatusDot /> 301
      </p>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
