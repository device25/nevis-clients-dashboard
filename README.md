# Nevis clients dashboard

A dashboard of client numbers per month, from the whole company down to a
branch, an adviser or an acquisition channel. A stacked bar chart shows the
selected row's breakdown over time, and an expandable table shows the
monthly figures at every level.

## Run and test

You need Node 24 or later and pnpm 12. The pnpm version is pinned in
`packageManager`, and `corepack enable` provides it.

```sh
pnpm install
pnpm dev                                # API on :3001, web app on http://localhost:5173
pnpm check                              # dedupe, typecheck, lint, format, 282 unit and component tests
pnpm exec playwright install chromium   # once, before the first end-to-end run
pnpm test:e2e                           # builds, starts the real server, 8 Playwright tests in Chromium
pnpm build && pnpm start                # production build, served at http://localhost:3001
```

- **`pnpm dev`** proxies `/api` from Vite to the API.
- **`pnpm test:e2e`** needs port 3001 to be free.
- **`pnpm start`** serves the built app from the API and runs it through
  `tsx`, with no compile step. It sets `NODE_ENV` with POSIX shell syntax, so
  it does not run on Windows as written.
- **`pnpm verify:compiler`**, run after `pnpm build`, fails unless the bundle
  contains React Compiler output.
- **CI:** `.github/workflows/ci.yml` runs all of this on a clean install. It
  has not run yet, because nothing has been pushed.

The API reads three switches, under both `pnpm dev` and `pnpm start`. An
invalid value stops the server at startup with a message.

| Variable       | Values                                 | Effect                                                                        |
| -------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| `API_DELAY_MS` | a non-negative integer of milliseconds | Delays `GET /api/clients`, to show the loading skeleton                       |
| `API_FAIL`     | `true`, `false`, `1` or `0`            | Answers 500 with `{"error":"Internal Server Error"}`, to show the error state |
| `PORT`         | a port, default 3001                   | Where the API listens                                                         |

For example: `API_DELAY_MS=3000 pnpm dev`, or `API_FAIL=1 pnpm dev`.

## Structure

```
apps/web ──► @nevis/data ──► @nevis/contract ◄── apps/api
   └───────► @nevis/design-system
```

- **`packages/contract`:** the zod schema of a client node and the twelve
  months, shared by server and client.
- **`packages/data`:** fetches and validates `/api/clients` and turns the
  payload into a typed tree. It exposes the tree through `useClientsTree()`;
  TanStack Query and Suspense are used inside and are not exported.
- **`packages/design-system`:**
  - tokens and the layout and text components;
  - the error components;
  - the SVG `StackedBarChart`;
  - the accessible `TreeGrid`.

  It knows nothing about clients.

- **`apps/api`:** a Fastify server. It validates the payload at startup, serves
  it unchanged at `GET /api/clients`, and in production also serves the built
  app.
- **`apps/web`:** the page. A pure model computes the mismatches and the chart
  scope, and the UI connects the data to the design system. It contains no
  CSS.

Packages are used from source, with no build step. TypeScript project
references and ESLint enforce the arrows above and the layers inside each
package, as listed in `AGENTS.md`. Every decision is recorded in
`docs/DECISIONS.md`, with the visual and accessibility specifications in
`docs/DESIGN.md` and `docs/ACCESSIBILITY.md`.

## Why it is built this way

- **Packages (D8):** the brief asks for component APIs with clear boundaries,
  as on a real team. Separate packages make those boundaries something the
  build enforces, not a convention; with no build step or publishing, each
  package costs one `package.json`.
- **One contract (D9):** the server validates its payload at startup and the
  client validates the response with the same schema; a package is the only
  way to share it without one app importing the other.
- **Data package (D10):** the transport can change without touching the UI,
  and the UI is tested with `TestDataProvider` instead of a network.
- **TanStack Query with Suspense (D11):** it is one request today, but loading,
  error, retry, cancellation and Suspense are the same work for one request as
  for ten, and writing that by hand is the part that usually goes wrong.
- **Components only (D12):** the app writes no CSS and imports no internals; a
  design change happens in one package.
- **SCSS modules on tokens (D13):** utility CSS would require the app's build
  to scan the design system's source, which breaks the package boundary;
  tokens give the same consistency, and the two layout primitives let the app
  compose layout without writing CSS.
- **React Compiler (D14):** memoisation is the compiler's job in React 19; the
  code has no `useMemo` or `useCallback` for performance, and the production
  bundle is checked to contain compiled output.
- **Own SVG chart (D15):** the design clips each stack as one rounded shape,
  stacks segments without a gap and uses a dotted grid; a small SVG component
  matches that exactly, is fully testable, and adds no charting dependency.
- **Loading (D16):** loading is declared once around the dashboard instead of
  being branched on in every component.
- **Errors (D17):** a failed request replaces the dashboard because neither
  view works without data; a rendering failure in the chart leaves the table
  usable; anything else reaches the root boundary.
- **Test layers (D18):** unit and component tests prove the parts, one
  end-to-end spec proves they work together, and CI proves a clean install
  works for someone else.

## Decisions and assumptions

- **Reported values are shown as they are** (D1). Parents are never
  recomputed from their children, and the API serves the payload unchanged.
- **Totals that don't add up are flagged, not fixed** (D2). The cell shows a
  dot and carries a hidden description, for example "Reported 301, children add
  up to 279." The chart tooltip shows the children's total, and the reported
  total where it differs.
- **The chart follows the selected row** (D3). It stacks one series per child,
  in source order; a leaf shows its own values. Company is selected on load,
  and rows are selected in the table (click or Space). Expanding or collapsing
  never changes the chart.
- **Months and units** (D4). The twelve values run from Feb 2024 to Jan 2025
  and count clients.
- **Leaves have no chevron** (D5) and no expanded state.
- **Advisers get initials avatars** (D6), coloured from their id.
- **The flat Sep–Dec 2024 period is shown as reported** (D7).

D20–D24 record decisions taken during the build:

- the newest tooling versions that work together;
- the data package re-exports the months;
- the chart switches to its narrow layout by its own width, and labels fewer
  months when they would collide;
- details of the table;
- changes made after the audit and the review.

## What the brief got wrong

**Seven totals don't add up.** The payload is served as it is, so the app
flags these cells instead of hiding the difference:

| Node           | Month    | Reported | Children add up to |
| -------------- | -------- | -------: | -----------------: |
| Company        | May 2024 |      301 |                279 |
| Branch 1       | Aug 2024 |      214 |                216 |
| Anna Blackwood | May 2024 |       31 |                 30 |
| Anna Blackwood | Jun 2024 |       32 |                 33 |
| Anna Blackwood | Jul 2024 |       34 |                 35 |
| Anna Blackwood | Aug 2024 |       38 |                 36 |
| Anna Blackwood | Sep 2024 |       27 |                 28 |

Probable causes:

- **Company, May 2024:** Maria Gutierrez reads 22 between 41 and 46. At 44,
  Branch 1 would be 178, and Company's 301 would add up.
- **Branch 1, Aug 2024:** the design shows Robert Chen at 56 instead of 58,
  which adds up to 214.
- **Anna Blackwood, May–Sep 2024:** the design's "New paid" series
  (0, 0, 1, 2, 1, 0, 2, 1, 1, 1, 1, 2) adds up in every month, but the
  payload's does not.

Three other problems:

- **The design's chart splits the whole company by acquisition channel, but
  only Anna Blackwood has channel data.** Drawing that split would mean
  inventing numbers. The chart follows the selected row instead, and at Anna
  Blackwood it reproduces the design's channel chart. A note under the legend
  at Company scope says why.
- **The design draws chevrons on rows that have no children.** Here a leaf has
  neither a chevron nor an expanded state, because a control that does nothing
  misleads keyboard and screen-reader users.
- **The data looks partly like placeholders.** Every node is flat from Sep to
  Dec 2024 and jumps in Jan 2025.

## Open questions for product

- Where a parent and its children disagree, which total is correct, and who
  fixes it upstream?
- Is channel data expected for every adviser? The design's chart assumes so.
- What do the values count: clients, households or accounts?
- Can the API return the reporting period, instead of the client assuming
  Feb 2024 to Jan 2025?
- Should avatars come from the API?
- Is it acceptable to label every second month on narrow screens and on
  charts narrower than about 1030px? The table and the tooltip still name
  every month.

## Accessibility

**Pattern.** The table is a native `<table role="treegrid">` following the
WAI-ARIA Authoring Practices treegrid pattern, with rows-first keyboard
navigation:

- arrows, Home and End, Ctrl+Home and Ctrl+End, Page Up and Page Down;
- Enter toggles a row and Space selects it;
- there is a single tab stop.

The hierarchy reaches assistive technology through `aria-level`,
`aria-setsize`, `aria-posinset`, `aria-expanded` and `aria-selected`. The
chart is an image named by its scope, grouping and range, with the legend as a
list; the table is its accessible data view.

The target is WCAG 2.2 AA. The references and every rule are listed in
`docs/ACCESSIBILITY.md`.

**Tested automatically:**

- every key in the keyboard table, from a row and from a cell;
- the ARIA attributes on all twelve rows of the real tree;
- exactly one tab stop after every interaction, and focus recovery after a
  collapse;
- focus on the error heading, and on the page heading after a successful
  retry;
- axe-core on the skeleton, the data and widget errors, the collapsed and
  expanded tables, and the chart at Company and Anna Blackwood scope;
- in Chromium, no horizontal scroll at 320px and 375px, no overlapping axis
  labels, and no layout shift when the data arrives.

axe runs in jsdom with its colour-contrast rule off. Contrast, text spacing
and the chart tooltip were therefore checked by an audit in Chromium: the
focus ring is at 4.9–5.7:1 and secondary text at 4.7–4.8:1.

**Still needs a manual screen-reader pass** (VoiceOver and NVDA):

- how a row is announced on entering the table;
- whether "not selected" is spoken on every row;
- whether the mismatch description follows the value in a cell;
- the chart's name and legend;
- the "Loading clients" status, with `API_DELAY_MS`;
- the data error, with `API_FAIL=1`, and the root error page.

## How AI was used

The project was built with Claude Code from `AGENTS.md` and
`.claude/PLAN.md`. A main session acted as orchestrator: it wrote no product
code, and instead:

- started one subagent per task and gave each its specification;
- reviewed and merged every branch after `pnpm check` passed on it and again
  on `main`;
- recorded decisions in `docs/DECISIONS.md`;
- wrote this README.

The engineers worked in separate git worktrees, wrote a failing test before
each behaviour, and committed after each step. The auditor and the reviewer
could read but not write.

| Agent                    | Model             | Produced                                                     |
| ------------------------ | ----------------- | ------------------------------------------------------------ |
| orchestrator             | Claude Opus 5.5   | task specifications, reviews, merges, decisions D20–D24      |
| `scaffolder`             | Claude Sonnet 5.5 | workspace, tooling, lint rules, CI, contract, API            |
| `data-engineer`          | Claude Sonnet 5.5 | `@nevis/data`                                                |
| `design-system-engineer` | Claude Sonnet 5.5 | tokens, primitives, error components, chart, skeleton        |
| `treegrid-engineer`      | Claude Opus 5.5   | `TreeGrid` and `useTreeState`                                |
| `app-engineer`           | Claude Sonnet 5.5 | the model, the page, its boundaries and the end-to-end tests |
| `a11y-auditor`           | Claude Opus 5.5   | accessibility audit                                          |
| `reviewer`               | Claude Fable 5.1  | independent review against the brief and the documents       |

How the checks changed the code:

- **While merging, the orchestrator found:**
  - the contract's emitted types turned nested children into `any`, and the
    data package had worked around that;
  - `apps/web` had no allowed way to get the month labels (D22);
  - the chart's accessible name lacked its scope path;
  - D15 contradicted the visual specification;
  - the app engineer's screenshots showed the page shifting when the data
    arrived, because the skeleton had no room for the scope note.
- **Engineers reported conflicts** where the documents could not all be met:
  - TypeScript 7 and ESLint 10 don't work with the lint plugins (D20);
  - an empty column header fails axe (D23);
  - twelve full month labels overlap below a certain width (D21).
- **The accessibility audit found four blocking problems:**
  - the chart tooltip could not be dismissed with Escape, and it vanished
    when the pointer moved onto it (WCAG 1.4.13);
  - month labels overlapped at 320px and under user text spacing, and axis
    labels were clipped (WCAG 1.4.10 and 1.4.12);
  - focus was lost after a widget retry.

  It also flagged the loading status sitting inside the busy region, where
  screen readers may not announce it. All of these are fixed and covered by
  tests.

- **The review found nothing blocking in the code.** Its other findings
  changed:
  - a gap in the lint rules for relative imports;
  - server paths that broke when the checkout path contains a space;
  - unreachable retry code, now removed;
  - totals in the tooltip of rows without children;
  - missing tests for how payload values reach the chart and for the real
    hierarchy;
  - a test that spied on `fetch` instead of using MSW.

> **[Owner: add your own account here of how you worked with AI, what you
> changed or rejected, and what you would do differently.]**

## What I would do next

- Run the manual screen-reader pass listed above, and fix what it finds.
- Push the repository and let CI run on a clean machine for the first time.
- Ask for the reporting period and a reconciled payload from the API, and
  agree which total wins.
- Measure axis label widths in the browser instead of estimating them, so
  that all twelve labels show unless the user has enlarged the text spacing.
- Add visual regression tests against the design at 1440px and 375px.
- Make `pnpm start` portable to Windows.

## Time spent

> **[Owner: add the time spent, including the analysis before the build.]**
