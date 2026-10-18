import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '#test-support/axe';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from '#components';

const props = {
  title: 'Something went wrong',
  message: 'The server ran into a problem. Try again.',
  actionLabel: 'Try again',
};

describe('ErrorState', () => {
  it('is an alert with a heading, a message and a native button', async () => {
    const { container } = render(<ErrorState {...props} onAction={vi.fn()} />);
    const alert = screen.getByRole('alert');
    expect(alert).toContainElement(
      screen.getByRole('heading', { name: 'Something went wrong', level: 2 }),
    );
    expect(alert).toHaveTextContent(
      'The server ran into a problem. Try again.',
    );
    expect(screen.getByRole('button', { name: 'Try again' }).tagName).toBe(
      'BUTTON',
    );
    await expectNoAxeViolations(container);
  });

  it('moves focus to its heading when it appears', () => {
    render(<ErrorState {...props} onAction={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toHaveFocus();
  });

  it('takes the heading level it is given', () => {
    render(<ErrorState {...props} headingLevel={1} onAction={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'Something went wrong', level: 1 }),
    ).toBeInTheDocument();
  });

  it('calls onAction when the button is activated', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState {...props} onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('puts the action one Tab after the heading', async () => {
    const user = userEvent.setup();
    render(<ErrorState {...props} onAction={vi.fn()} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
  });
});
