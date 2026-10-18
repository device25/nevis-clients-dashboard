import { screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { createAppRoot } from './createAppRoot';
import { reportError } from './reportError';
import { RootErrorBoundary } from './RootErrorBoundary';

function Broken(): never {
  throw new Error('rendering failed');
}

let container: HTMLElement;
let consoleError: MockInstance<typeof console.error>;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  container.remove();
  vi.restoreAllMocks();
});

describe('reportError', () => {
  it('logs the error with where it happened', () => {
    const error = new Error('boom');

    reportError(error, { componentStack: '\n    at Widget' });

    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError.mock.calls[0]).toContain(error);
    expect(String(consoleError.mock.calls[0])).toContain('at Widget');
  });
});

describe('the app root', () => {
  it('reports an error a boundary caught, once', async () => {
    const root = createAppRoot(container);

    root.render(
      <RootErrorBoundary>
        <Broken />
      </RootErrorBoundary>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }),
    ).toBeVisible();
    expect(consoleError).toHaveBeenCalledOnce();
    expect(String(consoleError.mock.calls[0])).toContain('rendering failed');
    root.unmount();
  });

  it('reports an error nothing caught, once', async () => {
    const root = createAppRoot(container);

    root.render(<Broken />);

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledOnce();
    });
    expect(String(consoleError.mock.calls[0])).toContain('rendering failed');
    root.unmount();
  });
});
