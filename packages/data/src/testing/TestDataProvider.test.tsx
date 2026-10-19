import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Component, type ReactNode } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { DataError, useClientsTree, type HierarchyNode } from '../index';
import { TestDataProvider } from './index';

const tree: HierarchyNode = {
  id: 'root',
  name: 'Test company',
  kind: 'company',
  level: 1,
  values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  children: [],
};

let clientsRequests = 0;
const server = setupServer(
  http.get('*/api/clients', () => {
    clientsRequests += 1;
    return HttpResponse.json([]);
  }),
);

// Gives a request, if one were made, time to reach the server.
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

function Name() {
  return <p>{useClientsTree().name}</p>;
}

class Boundary extends Component<{ children: ReactNode }, { error: unknown }> {
  override state: { error: unknown } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  override render() {
    const { error } = this.state;
    if (error instanceof DataError) {
      return <p role="alert">{`${error.kind} ${String(error.status)}`}</p>;
    }
    return this.props.children;
  }
}

describe('TestDataProvider', () => {
  beforeAll(() => {
    // Any request outside the handler above fails the test run.
    server.listen({ onUnhandledFrame: 'error' });
    // React logs the error it hands to the boundary; not under test here.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    clientsRequests = 0;
  });
  afterAll(() => {
    server.close();
    vi.restoreAllMocks();
  });

  it('gives consumers the tree on the first render, without a request', async () => {
    render(
      <TestDataProvider tree={tree}>
        <Name />
      </TestDataProvider>,
    );

    expect(screen.getByText('Test company')).toBeTruthy();
    await settle();
    expect(clientsRequests).toBe(0);
  });

  it('throws the given error to the nearest boundary, without a request', async () => {
    render(
      <Boundary>
        <TestDataProvider error={new DataError('http', { status: 503 })}>
          <Name />
        </TestDataProvider>
      </Boundary>,
    );

    expect(screen.getByRole('alert').textContent).toBe('http 503');
    await settle();
    expect(clientsRequests).toBe(0);
  });
});
