import { fireEvent, render, screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Component, Suspense, type ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  DataError,
  DataProvider,
  DataResetBoundary,
  useClientsTree,
  type HierarchyNode,
} from './index';
import { clientsPayload } from './fixtures/clients';

const baseUrl = 'http://api.test';
const url = `${baseUrl}/api/clients`;

const server = setupServer();
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

function names(node: HierarchyNode): string[] {
  return [node.name, ...node.children.flatMap(names)];
}

function Names() {
  const root = useClientsTree();
  return <p>{names(root).join(', ')}</p>;
}

// A minimal boundary: the design system's one is not a dependency of this package.
class Boundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { error: unknown }
> {
  override state: { error: unknown } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  override render() {
    const { error } = this.state;
    if (error === null) return this.props.children;
    const description =
      error instanceof DataError
        ? `${error.kind}${error.status === undefined ? '' : ` ${String(error.status)}`}`
        : 'unknown';
    return (
      <div role="alert">
        <p>Failed: {description}</p>
        <button
          type="button"
          onClick={() => {
            this.props.onReset?.();
            this.setState({ error: null });
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}

function renderConsumer() {
  return render(
    <DataProvider baseUrl={baseUrl}>
      <DataResetBoundary>
        {({ reset }) => (
          <Boundary onReset={reset}>
            <Suspense fallback={<p>Loading</p>}>
              <Names />
            </Suspense>
          </Boundary>
        )}
      </DataResetBoundary>
    </DataProvider>,
  );
}

describe('useClientsTree', () => {
  it('suspends, then returns the tree with all 12 nodes in source order', async () => {
    server.use(
      http.get(url, async () => {
        await delay(20);
        return HttpResponse.json(clientsPayload);
      }),
    );

    renderConsumer();

    expect(screen.getByText('Loading')).toBeTruthy();
    expect(
      await screen.findByText(
        'Company, Branch 1, Anna Blackwood, Existing clients, New organic, New paid, James Walker, Maria Gutierrez, Robert Chen, Sarah Smith, Branch 2, Branch 3',
      ),
    ).toBeTruthy();
  });

  it('requests the data once however many consumers read it', async () => {
    let requests = 0;
    server.use(
      http.get(url, () => {
        requests += 1;
        return HttpResponse.json(clientsPayload);
      }),
    );

    render(
      <DataProvider baseUrl={baseUrl}>
        <Suspense fallback={<p>Loading</p>}>
          <Names />
          <Names />
        </Suspense>
      </DataProvider>,
    );

    expect(await screen.findAllByText(/^Company, Branch 1/)).toHaveLength(2);
    expect(requests).toBe(1);
  });

  it.each([
    ['network', () => HttpResponse.error(), 'Failed: network'],
    [
      'http',
      () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      'Failed: http 500',
    ],
    [
      'invalid-response',
      () => HttpResponse.json({ ...clientsPayload, values: [1] }),
      'Failed: invalid-response',
    ],
  ])(
    'throws a DataError of kind %s to the nearest boundary',
    async (_kind, respond, text) => {
      server.use(http.get(url, respond));

      renderConsumer();

      expect(await screen.findByText(text)).toBeTruthy();
    },
  );

  it('requests again after the boundary resets, and then shows the data', async () => {
    let requests = 0;
    server.use(
      http.get(url, () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json(
              { error: 'Internal Server Error' },
              { status: 500 },
            )
          : HttpResponse.json(clientsPayload);
      }),
    );
    renderConsumer();
    await screen.findByText('Failed: http 500');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(/^Company, Branch 1/)).toBeTruthy();
    expect(requests).toBe(2);
  });
});
