import { DataError, DataProvider } from '@nevis/data';
import { TestDataProvider } from '@nevis/data/testing';
import { ErrorBoundary } from '@nevis/design-system';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '#test-support/axe';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ClientsPage } from './ClientsPage';
import { DataBoundary } from './DataBoundary';
import { clientsPayload } from './testing/clientsPayload';
import {
  BASE_URL,
  CLIENTS_URL,
  setupApiServer,
  stubBrowserApis,
} from './testing/environment';

const server = setupApiServer();
stubBrowserApis();

const TITLE = 'Clients could not be loaded';

describe.each([
  [
    'network',
    new DataError('network'),
    "Can't reach the server. Check your connection and try again.",
  ],
  [
    'http',
    new DataError('http', { status: 500 }),
    'The server ran into a problem. Try again.',
  ],
  [
    'invalid-response',
    new DataError('invalid-response'),
    "We received data we couldn't read.",
  ],
])('a %s error', (_kind, error, message) => {
  function renderFailed() {
    return render(
      <TestDataProvider error={error}>
        <ClientsPage />
      </TestDataProvider>,
    );
  }

  it('replaces the dashboard with its message and moves focus to the error heading', () => {
    renderFailed();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(message);
    expect(screen.getByRole('heading', { name: TITLE })).toHaveFocus();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Clients' }),
    ).toBeVisible();
    expect(screen.queryByRole('treegrid')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  it('has no axe violations', async () => {
    const { container } = renderFailed();

    await expectNoAxeViolations(container);
  });
});

describe('"Try again"', () => {
  function failOnce() {
    let requests = 0;
    server.use(
      http.get(CLIENTS_URL, () => {
        requests += 1;
        return requests === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(clientsPayload);
      }),
    );
  }

  function renderPage() {
    return render(
      <DataProvider baseUrl={BASE_URL}>
        <ClientsPage />
      </DataProvider>,
    );
  }

  it('requests the data again and moves focus to the "Clients" heading on success', async () => {
    const user = userEvent.setup();
    failOnce();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('treegrid', { name: 'Clients' }),
    ).toBeVisible();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Clients' }),
      ).toHaveFocus();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('moves focus to the error heading when the request fails again', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(CLIENTS_URL, () => new HttpResponse(null, { status: 503 })),
    );
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: TITLE })).toHaveFocus();
    });
  });

  it('does not move focus when the first load succeeds', async () => {
    server.use(http.get(CLIENTS_URL, () => HttpResponse.json(clientsPayload)));
    renderPage();

    await screen.findByRole('treegrid', { name: 'Clients' });

    expect(document.body).toHaveFocus();
  });
});

describe('the data boundary', () => {
  const MAX_SILENT_RETRIES = 3;

  it('retries a cancelled request without showing an error', async () => {
    let attempts = 0;
    function CancelledTwice() {
      attempts += 1;
      if (attempts <= 2) throw new DataError('aborted');
      return <p>Loaded</p>;
    }

    render(
      <TestDataProvider error={new DataError('aborted')}>
        <DataBoundary onRetry={() => undefined}>
          <CancelledTwice />
        </DataBoundary>
      </TestDataProvider>,
      // React retries a failed concurrent render once by itself and reports
      // that as recoverable; the test is about the boundary, not about that.
      { onRecoverableError: () => undefined },
    );

    expect(await screen.findByText('Loaded')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('gives up after a few silent retries and shows the connection message', async () => {
    let renders = 0;
    function AlwaysCancelled(): never {
      renders += 1;
      throw new DataError('aborted');
    }

    render(
      <TestDataProvider error={new DataError('aborted')}>
        <DataBoundary onRetry={() => undefined}>
          <AlwaysCancelled />
        </DataBoundary>
      </TestDataProvider>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Can't reach the server. Check your connection and try again.",
    );
    expect(renders).toBeGreaterThanOrEqual(MAX_SILENT_RETRIES);
  });

  it('lets an error that is not a DataError reach the boundary above', () => {
    function Broken(): never {
      throw new Error('not about data');
    }

    render(
      <ErrorBoundary
        fallback={(error) => (
          <p>{`Outer boundary: ${error instanceof Error ? error.message : ''}`}</p>
        )}
      >
        <TestDataProvider error={new DataError('network')}>
          <DataBoundary onRetry={() => undefined}>
            <Broken />
          </DataBoundary>
        </TestDataProvider>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Outer boundary: not about data')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
