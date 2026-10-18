import { DataProvider } from '@nevis/data';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '#test-support/axe';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ClientsPage } from './ClientsPage';
import { clientsPayload } from './testing/clientsPayload';
import {
  BASE_URL,
  CLIENTS_URL,
  setupApiServer,
  stubBrowserApis,
} from './testing/environment';

const server = setupApiServer();
stubBrowserApis();

function renderPage() {
  return render(
    <DataProvider baseUrl={BASE_URL}>
      <ClientsPage />
    </DataProvider>,
  );
}

async function renderLoaded() {
  server.use(http.get(CLIENTS_URL, () => HttpResponse.json(clientsPayload)));
  const view = renderPage();
  await screen.findByRole('treegrid', { name: 'Clients' });
  // The chart draws once it has measured itself, a moment after it mounts.
  await screen.findByRole('img');
  return view;
}

const chart = () => screen.getByRole('region', { name: 'Chart' });
const row = (name: string) => screen.getByRole('row', { name });

function legend() {
  return within(chart())
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

const COMPANY_CHART_NAME =
  'Company, by branch, Feb 2024 to Jan 2025, between 250 and 350 a month.';
const SCOPE_NOTE =
  'Acquisition channels are recorded for one adviser only, so the company view is split by branch. Select Anna Blackwood to see the channel split.';

describe('while the data is loading', () => {
  function renderPending() {
    server.use(
      http.get(CLIENTS_URL, async () => {
        await delay('infinite');
        return HttpResponse.json(clientsPayload);
      }),
    );
    return renderPage();
  }

  it('shows the heading and a busy dashboard that announces "Loading clients"', () => {
    renderPending();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Clients' }),
    ).toBeVisible();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading clients');
    expect(status.closest('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole('treegrid')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderPending();

    await expectNoAxeViolations(container);
  });
});

describe('the loaded dashboard', () => {
  it('opens with Company expanded and selected, and every other row collapsed', async () => {
    await renderLoaded();

    expect(
      screen.getAllByRole('row').map((r) => r.getAttribute('aria-label')),
    ).toEqual([null, 'Company', 'Branch 1', 'Branch 2', 'Branch 3']);
    expect(row('Company')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Company')).toHaveAttribute('aria-selected', 'true');
    expect(row('Branch 1')).toHaveAttribute('aria-expanded', 'false');
    expect(row('Branch 1')).toHaveAttribute('aria-selected', 'false');
    expect(row('Branch 2')).not.toHaveAttribute('aria-expanded');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the Company scope: path, grouping, three branches, name and scope note', async () => {
    await renderLoaded();

    expect(legend()).toEqual(['Branch 1', 'Branch 2', 'Branch 3']);
    expect(chart()).toHaveTextContent('Company');
    expect(chart()).toHaveTextContent('By branch');
    expect(
      screen.getByRole('img', { name: COMPANY_CHART_NAME }),
    ).toBeInTheDocument();
    expect(screen.getByText(SCOPE_NOTE)).toBeVisible();
  });

  it('selects Branch 1 on click: five advisers, "By adviser", no scope note', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(row('Branch 1'));

    expect(row('Branch 1')).toHaveAttribute('aria-selected', 'true');
    expect(legend()).toEqual([
      'Anna Blackwood',
      'James Walker',
      'Maria Gutierrez',
      'Robert Chen',
      'Sarah Smith',
    ]);
    expect(chart()).toHaveTextContent('Company › Branch 1');
    expect(chart()).toHaveTextContent('By adviser');
    expect(screen.queryByText(SCOPE_NOTE)).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Company › Branch 1, by adviser, Feb 2024 to Jan 2025, between 147 and 216 a month.',
      }),
    ).toBeInTheDocument();
  });

  it('selects Branch 1 with Space', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    row('Branch 1').focus();
    await user.keyboard(' ');

    expect(row('Branch 1')).toHaveAttribute('aria-selected', 'true');
    expect(legend()).toHaveLength(5);
    expect(chart()).toHaveTextContent('By adviser');
  });

  it('leaves the chart and the selection alone when rows are expanded', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    row('Company').focus();
    await user.keyboard('{ArrowDown}{ArrowRight}');

    expect(row('Branch 1')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Anna Blackwood')).toBeInTheDocument();
    expect(row('Company')).toHaveAttribute('aria-selected', 'true');
    expect(legend()).toEqual(['Branch 1', 'Branch 2', 'Branch 3']);
    expect(chart()).toHaveTextContent('By branch');
    expect(screen.getByText(SCOPE_NOTE)).toBeVisible();
  });

  it('leaves the rows expanded when another row is selected', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(row('Branch 2'));

    expect(row('Company')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Branch 1')).toHaveAttribute('aria-expanded', 'false');
    expect(legend()).toEqual(['Branch 2']);
    expect(chart()).toHaveTextContent('Monthly total');
  });

  it('shows the channel split at Anna Blackwood and returns to the branches at Company', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    row('Company').focus();
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowDown} ');

    expect(legend()).toEqual(['Existing clients', 'New organic', 'New paid']);
    expect(chart()).toHaveTextContent('Company › Branch 1 › Anna Blackwood');
    expect(chart()).toHaveTextContent('By acquisition channel');
    expect(screen.queryByText(SCOPE_NOTE)).not.toBeInTheDocument();

    await user.click(row('Company'));

    expect(legend()).toEqual(['Branch 1', 'Branch 2', 'Branch 3']);
    expect(chart()).toHaveTextContent('By branch');
    expect(screen.getByText(SCOPE_NOTE)).toBeVisible();
  });

  it('describes the mismatch in the May 2024 Company cell', async () => {
    await renderLoaded();

    const cell = within(row('Company')).getAllByRole('gridcell')[3];

    expect(cell).toHaveTextContent('301');
    expect(cell).toHaveAccessibleDescription(
      'Reported 301, children add up to 279.',
    );
    const february = within(row('Company')).getAllByRole('gridcell')[0];
    expect(february).toHaveTextContent('250');
    expect(february).not.toHaveAccessibleDescription();
  });

  it('draws the tooltip with the children total and, where it differs, the reported total', async () => {
    await renderLoaded();
    const svg = screen.getByRole('img', { name: COMPANY_CHART_NAME });

    // The May 2024 column starts 50 + 3 x 111.5px from the left of the plot.
    fireEvent.pointerMove(svg, { clientX: 400, clientY: 100 });

    expect(screen.getByText('Children total').parentElement).toHaveTextContent(
      '279',
    );
    expect(screen.getByText('Reported total').parentElement).toHaveTextContent(
      '301',
    );

    fireEvent.pointerMove(svg, { clientX: 60, clientY: 100 });

    expect(screen.getByText('Children total').parentElement).toHaveTextContent(
      '250',
    );
    expect(screen.queryByText('Reported total')).not.toBeInTheDocument();
  });

  it('has no axe violations at Company scope', async () => {
    const { container } = await renderLoaded();

    await expectNoAxeViolations(container);
  });

  it('has no axe violations at Anna Blackwood scope with the table fully expanded', async () => {
    const user = userEvent.setup();
    const { container } = await renderLoaded();

    row('Company').focus();
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowDown} ');

    await expectNoAxeViolations(container);
  });
});
