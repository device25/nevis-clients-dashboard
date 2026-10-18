import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '#test-support/axe';
import { expect, it } from 'vitest';
import { App } from './App';

it('renders the placeholder page and reacts to clicks', async () => {
  const { container } = render(<App />);
  await userEvent.click(
    screen.getByRole('button', { name: 'Clicked 0 times' }),
  );
  expect(screen.getByRole('button', { name: 'Clicked 1 times' })).toBeVisible();
  await expectNoAxeViolations(container);
});
