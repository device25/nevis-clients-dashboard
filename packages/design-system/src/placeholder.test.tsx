import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '#test-support/axe';
import { expect, it } from 'vitest';

it('renders in jsdom with jest-dom matchers and the axe helper', async () => {
  const { container } = render(
    <main>
      <h1>Design system</h1>
    </main>,
  );
  expect(screen.getByRole('heading', { name: 'Design system' })).toBeVisible();
  await expectNoAxeViolations(container);
});
