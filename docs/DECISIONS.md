# Decisions

Final unless the orchestrator records a change with its reason. The README
section "Why it is built this way" quotes the **Why** lines of this file.

## Product

### D1. Reported values are the truth on screen

Every row shows the `values` its node reports. Parents are never recomputed
from their children. The API serves the payload unchanged.
**Why:** silently correcting data hides a defect the business needs to see.

### D2. Totals that do not add up are flagged, not fixed

`findMismatches` returns exactly these seven entries, in this order:

| Node | Month | Reported | Children add up to |
|---|---|---|---|
| Company | May 2024 | 301 | 279 |
| Branch 1 | Aug 2024 | 214 | 216 |
| Anna Blackwood | May 2024 | 31 | 30 |
| Anna Blackwood | Jun 2024 | 32 | 33 |
| Anna Blackwood | Jul 2024 | 34 | 35 |
| Anna Blackwood | Aug 2024 | 38 | 36 |
| Anna Blackwood | Sep 2024 | 27 | 28 |

UI: the cell shows a `StatusDot` before the number and carries the hidden
description from `ACCESSIBILITY.md`. The chart tooltip shows "Children total"
and, only when it differs, "Reported total".

Probable causes, for the README only: Maria Gutierrez in May 2024 reads 22
between 41 and 46; 44 would reconcile Branch 1 (178) and Company (301). The
design shows Robert Chen in Aug 2024 as 56 instead of 58, which reconciles
Branch 1. The design's "New paid" series for Anna Blackwood
(0, 0, 1, 2, 1, 0, 2, 1, 1, 1, 1, 2) reconciles her channels in every month.
**Why:** the brief asks what it got wrong; the answer belongs in the product,
not only in the README.

### D3. The chart shows the selected row's children

- The chart's scope is the selected row. Company is selected on load.
  Rows are selected in the table only (click or Space).
- A parent scope stacks one series per child, in source order: Company →
  Branch 1, Branch 2, Branch 3; Branch 1 → its five advisers; Anna Blackwood
  → Existing clients, New organic, New paid.
- A leaf scope shows one series with the node's own values, coloured as it is
  among its parent's series.
- Above the chart: the scope path as text ("Company › Branch 1 › Anna
  Blackwood") and the grouping: "By branch", "By adviser", "By acquisition
  channel", or "Monthly total" for a leaf.
- At Company scope, a note under the legend: "Acquisition channels are
  recorded for one adviser only, so the company view is split by branch.
  Select Anna Blackwood to see the channel split."
- Expanding or collapsing rows never changes the chart. Selecting a row never
  changes expansion.

**Why:** the design splits the whole company by channel, but only one adviser
has channel data; drawing that split would mean inventing numbers. Following
the selected row uses only real data, delivers the brief's drill-down from
company to channel, and reproduces the design's channel chart exactly at
Anna Blackwood's scope.

### D4. Months and units

`MONTHS` in `@nevis/contract` is the single definition: Feb 2024 … Jan 2025,
each `{ key: 'YYYY-MM', label: 'Mon YYYY' }`, built from literals, not
`Date` parsing. Values are client counts, matching the title "Clients".

### D5. Leaves have no chevron

Branch 2, Branch 3, advisers without channels and every channel render
without a chevron and without `aria-expanded`.
**Why:** a control that does nothing misleads keyboard and screen-reader users.

### D6. Avatars are initials

Advisers show a 20px circle with initials; the background is chosen from the
node `id` among four avatar tokens.
**Why:** the payload has no image field, and design photos are not ours to
publish.

### D7. The flat Sep–Dec period is shown as reported

Every node is flat from Sep 2024 to Dec 2024 and jumps in Jan 2025; listed in
the README as likely placeholder data.

## Architecture

### D8. Three packages, two apps, no build step

`@nevis/contract`, `@nevis/data`, `@nevis/design-system`, `apps/api`,
`apps/web`, consumed from source through `exports`.
**Why:** the brief asks for component APIs with clear boundaries, as on a real
team. Separate packages make those boundaries something the build enforces,
not a convention; with no build step or publishing, each package costs one
`package.json`.

### D9. One contract for server and client

**Why:** the server validates its payload at startup and the client validates
the response with the same schema; a package is the only way to share it
without one app importing the other.

### D10. The data package hides the transport

Components call `useClientsTree()` and receive a `HierarchyNode` tree.
Fetching, validation, the adapter, caching and retry live behind it.
**Why:** the transport can change without touching the UI, and the UI is
tested with `TestDataProvider` instead of a network.

### D11. TanStack Query with Suspense

Inside `@nevis/data`: `useSuspenseQuery`, `retry: false`,
`refetchOnWindowFocus: false`, `staleTime: Infinity`; retry is explicit
through `DataResetBoundary`.
**Why:** it is one request today, but loading, error, retry, cancellation and
Suspense are the same work for one request as for ten, and writing that by
hand is the part that usually goes wrong.

### D12. The design system exposes components only

**Why:** the app writes no CSS and imports no internals; a design change
happens in one package.

### D13. SCSS modules on tokens; two layout primitives

Tokens are CSS custom properties; components use SCSS modules; `Stack` and
`Inline` take `gap` values from the spacing tokens.
**Why:** utility CSS would require the app's build to scan the design
system's source, which breaks the package boundary; tokens give the same
consistency, and the two primitives let the app compose layout without
writing CSS.

Exception recorded by the orchestrator on 2026-10-19: SCSS modules reach the
Sass partials in `tokens/` (mixins, geometry) with a relative `@use`. Sass
cannot resolve the package's `imports` aliases, and a load path would make
the package depend on its consumer's build configuration. The `../../` rule
in `AGENTS.md` applies to TypeScript modules.

### D14. React Compiler

**Why:** memoisation is the compiler's job in React 19; the code has no
`useMemo` or `useCallback` for performance, and the production bundle is
checked to contain compiled output.

### D15. Own SVG chart

**Why:** the design clips each stack as one rounded shape, stacks segments
without a gap and uses a dotted grid; a small SVG component matches that
exactly, is fully testable, and adds no charting dependency.

## Behaviour under load and failure

### D16. Loading

1. Document: `index.html` paints the page background and the "Clients"
   heading before JavaScript; Inter is preloaded with `font-display: swap`.
2. Code: one bundle. **Why:** a single screen has nothing to load later.
3. Data: one `Suspense` boundary around the dashboard; the fallback is a
   skeleton with the final layout (chart axes, 12 empty bar slots, table
   header, 4 rows) so nothing shifts when data arrives. The skeleton fades
   in after 150ms through CSS `animation-delay`, so a fast response shows no
   flash.
4. Retry: "Try again" resets the data boundary, the skeleton returns until
   the request settles, then focus moves to the "Clients" heading on success
   or to the error heading on failure.

**Why:** loading is declared once around the dashboard instead of being
branched on in every component.

### D17. Errors

Three boundaries, all built on the design system's `ErrorBoundary`:

| Boundary | Catches | Shows | Recovers |
|---|---|---|---|
| Root (`app/`) | Any uncaught rendering error | Full page: "Something went wrong" and "Reload" | `location.reload()` |
| Data (around the dashboard, inside `DataResetBoundary`) | Request and validation errors | `ErrorState` in place of the dashboard: message by error kind and "Try again" | Reset the query and retry |
| Widget (around the chart and around the table) | Rendering errors inside one widget | Inline `ErrorState`: "The chart could not be displayed" / "The table could not be displayed" and "Try again"; the other widget keeps working | Remount the widget |

`DataError.kind` and the messages `apps/web` shows:

| Kind | When | Message |
|---|---|---|
| `network` | The request failed to reach the server | "Can't reach the server. Check your connection and try again." |
| `http` | Status ≥ 400 | "The server ran into a problem. Try again." |
| `invalid-response` | Body is not JSON or fails the schema | "We received data we couldn't read." |
| `aborted` | The request was cancelled | Not shown |

Components never throw on edge cases of valid data: zero values, empty
children and single-series scopes render normally.

Reporting: `createRoot` options `onCaughtError`, `onUncaughtError` and
`onRecoverableError` call `reportError(error, context)` in `app/`, which logs
to the console; boundaries never log themselves, so each error is reported
once.
**Why:** a failed request replaces the dashboard because neither view works
without data; a rendering failure in the chart leaves the table usable;
anything else reaches the root boundary.

## Verification

### D18. Test layers

Vitest and Testing Library for packages and the app, MSW for the network,
one Playwright test against the real server, GitHub Actions running all of it.
**Why:** unit and component tests prove the parts, one end-to-end test proves
they work together, and CI proves a clean install works for someone else.

### D19. Deployment

Not deployed; the brief asks only how to run the project.
**Why:** a one-command local run plus green CI is what a reviewer needs.

## Tooling

### D20. Newest versions that work together

Recorded by the orchestrator on 2026-10-18, after the scaffolder reported
peer conflicts with npm's `latest` tags. Every catalog entry is the newest
stable release that satisfies the declared peer ranges of the other entries:

- `typescript` 6.0.x, not 7.x: `typescript-eslint` 8 supports
  `>=4.8.4 <6.1.0`, and TypeScript 7 has no JavaScript compiler API for
  type-checked linting.
- `eslint` and `@eslint/js` 9.x, not 10.x: `eslint-plugin-jsx-a11y` 6.10
  declares ESLint up to `^9`.
- `axe-core` is also a root dev dependency, because the shared
  `expectNoAxeViolations` helper lives at the root (shared tooling lives in
  the root `devDependencies`).

**Why:** type-checked linting and the accessibility lint rules are
requirements; a newer compiler or linter is not.

### D21. The chart goes narrow by its own width

Recorded by the orchestrator on 2026-10-19, from task DS1. The chart switches
to its narrow geometry (short month labels, 220px plot, 4px gaps) when its
own measured width is below 760px, not at a 640px viewport: twelve
"MMM YYYY" labels overlap below about 760px of chart width, which a viewport
rule would allow between 640px and about 830px. Page padding, title size and
the table still switch at a 640px viewport as `DESIGN.md` says.
**Why:** labels must not overlap at any width, and only the chart knows its
own width.

## Open questions (for the README)

- Which total is correct where a parent and its children disagree, and who
  owns the fix upstream?
- Is channel data expected for every adviser? The design's chart assumes so.
- What do the values count: clients, households, accounts?
- The API should return the reporting period instead of the client assuming it.
- Should avatars come from the API?
