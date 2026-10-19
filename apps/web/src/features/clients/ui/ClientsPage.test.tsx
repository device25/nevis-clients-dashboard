import { DataProvider } from '@nevis/data';
import {
  fireEvent,
  isInaccessible,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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

// The plot is 1376px wide; the columns start 50px in and repeat every 111.5px.
const FEB_X = 60;
const MAY_X = 400;

/**
 * Moves the pointer over a column of the chart and returns the rows of the
 * tooltip it opens, as [label, value], without the month that heads it.
 */
function tooltipAt(clientX: number, month: string) {
  fireEvent.pointerMove(screen.getByRole('img', { name: /a month\.$/ }), {
    clientX,
    clientY: 100,
  });
  // The month also labels an axis and heads a table column; the tooltip's
  // title is the third one.
  const title = screen
    .getAllByText(month)
    .find((element) => element.closest('svg, [role="treegrid"]') === null);
  const tooltip = title?.parentElement;
  if (!tooltip) throw new Error(`No tooltip for ${month}`);
  return Array.from(tooltip.children)
    .slice(1)
    .filter((line) => line.textContent !== '')
    .map((line) =>
      Array.from(line.children)
        .map((part) => part.textContent)
        .filter((text) => text !== ''),
    );
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

  it('shows the heading and a busy dashboard, and announces "Loading clients" in a status outside it', () => {
    renderPending();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Clients' }),
    ).toBeVisible();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading clients');
    expect(status.closest('[aria-busy]')).toBeNull();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole('treegrid')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('keeps the same, now empty, status element once the data has arrived', async () => {
    let respond: () => void = () => undefined;
    const arrived = new Promise<void>((resolve) => {
      respond = resolve;
    });
    server.use(
      http.get(CLIENTS_URL, async () => {
        await arrived;
        return HttpResponse.json(clientsPayload);
      }),
    );
    renderPage();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading clients');

    respond();
    await screen.findByRole('treegrid', { name: 'Clients' });

    expect(screen.getByRole('status')).toBe(status);
    await waitFor(() => {
      expect(status).toBeEmptyDOMElement();
    });
    expect(document.querySelector('[aria-busy]')).toBeNull();
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
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
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

  it('names the chart through a text that is not read a second time', async () => {
    await renderLoaded();

    const name = screen.getByText(COMPANY_CHART_NAME);

    expect(isInaccessible(name)).toBe(true);
    expect(
      screen.getByRole('img', { name: COMPANY_CHART_NAME }),
    ).toBeInTheDocument();
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

  it('shows the payload values of May 2024 in the tooltip at Company scope', async () => {
    await renderLoaded();

    expect(tooltipAt(MAY_X, 'May 2024')).toEqual([
      ['Branch 1', '156'],
      ['Branch 2', '87'],
      ['Branch 3', '36'],
      ['Children total', '279'],
      ['Reported total', '301'],
    ]);
  });

  it('leaves the reported total out where it equals the children total', async () => {
    await renderLoaded();

    expect(tooltipAt(FEB_X, 'Feb 2024')).toEqual([
      ['Branch 1', '147'],
      ['Branch 2', '76'],
      ['Branch 3', '27'],
      ['Children total', '250'],
    ]);
  });

  it('shows the payload values of May 2024 in the tooltip at Anna Blackwood', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    row('Company').focus();
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowDown} ');

    expect(tooltipAt(MAY_X, 'May 2024')).toEqual([
      ['Existing clients', '28'],
      ['New organic', '1'],
      ['New paid', '1'],
      ['Children total', '30'],
      ['Reported total', '31'],
    ]);
  });

  it('shows only the series in the tooltip at a leaf, with no totals', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(row('Branch 2'));

    expect(tooltipAt(MAY_X, 'May 2024')).toEqual([['Branch 2', '87']]);
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
