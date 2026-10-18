import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '#components';

function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error('boom');
  return <p>All good</p>;
}

beforeEach(() => {
  // React reports caught errors on the console; keep the test output readable.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary fallback={() => <p>Failed</p>}>
        <Bomb explode={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders the fallback with the error that was thrown', () => {
    render(
      <ErrorBoundary
        fallback={(error) => (
          <p>{error instanceof Error ? error.message : 'unknown'}</p>
        )}
      >
        <Bomb explode />
      </ErrorBoundary>,
    );
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(screen.queryByText('All good')).not.toBeInTheDocument();
  });

  it('renders the children again after reset and calls onReset first', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    function Harness() {
      const [explode, setExplode] = useState(true);
      return (
        <ErrorBoundary
          onReset={() => {
            onReset();
            setExplode(false);
          }}
          fallback={(_error, reset) => (
            <button type="button" onClick={reset}>
              Try again
            </button>
          )}
        >
          <Bomb explode={explode} />
        </ErrorBoundary>
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('resets when a reset key changes', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [attempt, setAttempt] = useState(0);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setAttempt(1);
            }}
          >
            Next attempt
          </button>
          <ErrorBoundary resetKeys={[attempt]} fallback={() => <p>Failed</p>}>
            <Bomb explode={attempt === 0} />
          </ErrorBoundary>
        </>
      );
    }
    render(<Harness />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next attempt' }));
    expect(screen.getByText('All good')).toBeInTheDocument();
  });
});
