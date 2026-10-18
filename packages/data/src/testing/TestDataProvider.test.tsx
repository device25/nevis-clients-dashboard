import { render, screen } from '@testing-library/react';
import { Component, type ReactNode } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
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
  // A request would fail anyway (fetch has no origin here); the spy makes the
  // reason explicit.
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  beforeAll(() => {
    // React logs the error it hands to the boundary; not under test here.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('gives consumers the tree on the first render, without a request', () => {
    render(
      <TestDataProvider tree={tree}>
        <Name />
      </TestDataProvider>,
    );

    expect(screen.getByText('Test company')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws the given error to the nearest boundary, without a request', () => {
    render(
      <Boundary>
        <TestDataProvider error={new DataError('http', { status: 503 })}>
          <Name />
        </TestDataProvider>
      </Boundary>,
    );

    expect(screen.getByRole('alert').textContent).toBe('http 503');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
