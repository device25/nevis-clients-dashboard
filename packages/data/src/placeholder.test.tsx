import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

it('renders in jsdom with Testing Library cleanup registered', () => {
  render(<p>data</p>);
  expect(screen.getAllByText('data')).toHaveLength(1);
});
