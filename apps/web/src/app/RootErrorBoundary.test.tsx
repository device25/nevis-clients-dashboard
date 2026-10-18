import { TestDataProvider } from '@nevis/data/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '#test-support/axe';
import { ClientsPage } from '#ui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RootErrorBoundary } from './RootErrorBoundary';

function Broken(): never {
  throw new Error('rendering failed');
}

beforeEach(() => {
  // React logs the errors the boundaries catch; the app reports them in
  // createAppRoot, which these tests do not use.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('the root error boundary', () => {
  it('replaces the page with "Something went wrong" and puts focus on that heading', () => {
    render(
      <RootErrorBoundary>
        <Broken />
      </RootErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toHaveFocus();
    expect(screen.getByRole('alert')).toBeVisible();
  });

  it('reloads the page on "Reload"', async () => {
    const reload = vi.fn();
    // jsdom's location cannot be spied on; the boundary reads the global.
    vi.stubGlobal('location', { reload });
    render(
      <RootErrorBoundary>
        <Broken />
      </RootErrorBoundary>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));

    expect(reload).toHaveBeenCalledOnce();
  });

  it('catches an error that is not about data, which the data boundary passes on', () => {
    render(
      <RootErrorBoundary>
        <TestDataProvider error={new Error('not a DataError')}>
          <ClientsPage />
        </TestDataProvider>
      </RootErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Clients could not be loaded' }),
    ).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <RootErrorBoundary>
        <Broken />
      </RootErrorBoundary>,
    );

    await expectNoAxeViolations(container);
  });
});
