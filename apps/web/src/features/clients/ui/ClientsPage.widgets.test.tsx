import { DataProvider, type HierarchyNode } from '@nevis/data';
import type * as DesignSystem from '@nevis/design-system';
import type { TreeGridProps } from '@nevis/design-system';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '#test-support/axe';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsPage } from './ClientsPage';
import { clientsPayload } from './testing/clientsPayload';
import {
  BASE_URL,
  CLIENTS_URL,
  setupApiServer,
  stubBrowserApis,
} from './testing/environment';

const failing = vi.hoisted(() => ({ chart: false, table: false }));

// The two widgets are the only parts replaced; everything else is real.
vi.mock('@nevis/design-system', async (importOriginal) => {
  const actual = await importOriginal<typeof DesignSystem>();
  return {
    ...actual,
    StackedBarChart: (props: Parameters<typeof actual.StackedBarChart>[0]) => {
      if (failing.chart) throw new Error('the chart is broken');
      return <actual.StackedBarChart {...props} />;
    },
    TreeGrid: (props: TreeGridProps<HierarchyNode>) => {
      if (failing.table) throw new Error('the table is broken');
      return <actual.TreeGrid {...props} />;
    },
  };
});

const server = setupApiServer();
stubBrowserApis();

beforeEach(() => {
  failing.chart = false;
  failing.table = false;
  server.use(http.get(CLIENTS_URL, () => HttpResponse.json(clientsPayload)));
  // React logs every error a boundary catches; these tests cause them.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
});

function renderPage() {
  return render(
    <DataProvider baseUrl={BASE_URL}>
      <ClientsPage />
    </DataProvider>,
  );
}

describe('a widget that fails to render', () => {
  it('replaces the chart only, and the table keeps working', async () => {
    const user = userEvent.setup();
    failing.chart = true;
    const { container } = renderPage();

    const chart = await screen.findByRole('region', { name: 'Chart' });
    const alert = within(chart).getByRole('alert');
    expect(alert).toHaveTextContent('The chart could not be displayed');
    expect(
      within(chart).getByRole('heading', {
        name: 'The chart could not be displayed',
      }),
    ).toHaveFocus();

    await user.click(screen.getByRole('row', { name: 'Branch 1' }));
    expect(screen.getByRole('row', { name: 'Branch 1' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      screen.getByRole('treegrid', { name: 'Clients' }),
    ).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('replaces the table only, and the chart keeps working', async () => {
    failing.table = true;
    const { container } = renderPage();

    const table = await screen.findByRole('region', { name: 'Table' });
    expect(within(table).getByRole('alert')).toHaveTextContent(
      'The table could not be displayed',
    );
    expect(
      await screen.findByRole('img', { name: /^Company, by branch/ }),
    ).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('remounts just that widget on "Try again"', async () => {
    const user = userEvent.setup();
    failing.chart = true;
    renderPage();
    const chart = await screen.findByRole('region', { name: 'Chart' });
    await user.click(screen.getByRole('row', { name: 'Branch 1' }));

    failing.chart = false;
    await user.click(within(chart).getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(
        screen.getByRole('img', { name: /^Company › Branch 1, by adviser/ }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // The table was not remounted: its selection survived.
    expect(screen.getByRole('row', { name: 'Branch 1' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('moves focus to the "Clients" heading when the chart comes back', async () => {
    const user = userEvent.setup();
    failing.chart = true;
    renderPage();
    const chart = await screen.findByRole('region', { name: 'Chart' });

    failing.chart = false;
    await user.click(within(chart).getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Clients' }),
      ).toHaveFocus();
    });
  });

  it('moves focus to the "Clients" heading when the table comes back', async () => {
    const user = userEvent.setup();
    failing.table = true;
    renderPage();
    const table = await screen.findByRole('region', { name: 'Table' });

    failing.table = false;
    await user.click(within(table).getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Clients' }),
      ).toHaveFocus();
    });
  });

  it('moves focus to the new error heading when the widget fails again', async () => {
    const user = userEvent.setup();
    failing.chart = true;
    renderPage();
    const chart = await screen.findByRole('region', { name: 'Chart' });

    await user.click(within(chart).getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(
        within(chart).getByRole('heading', {
          name: 'The chart could not be displayed',
        }),
      ).toHaveFocus();
    });
  });
});
