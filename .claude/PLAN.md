# Implementation plan

Tasks run in waves. Tasks in one wave are independent and run in parallel; a
wave starts when everything it depends on is merged into `main`. A task is
finished when every acceptance criterion holds and `pnpm check` passes.

## Wave 0 — Scaffold (on `main`, `scaffolder`)

### S1. Workspace, tooling, CI

Owns: repository root, every `package.json`, every config file,
`.github/workflows/ci.yml`, placeholder `src/index.ts` files.

- pnpm workspace: `packages/contract`, `packages/data`,
  `packages/design-system`, `apps/api`, `apps/web`. `packageManager` pinned;
  `engines.node` `>=24`; `.nvmrc` `24`.
- Catalog in `pnpm-workspace.yaml` with latest stable versions of exactly:
  - root dev: `typescript`, `eslint`, `@eslint/js`, `typescript-eslint`,
    `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `globals`,
    `prettier`, `vitest`, `concurrently`, `@playwright/test`
  - contract: `zod`
  - data: `@tanstack/react-query`; dev `msw`, `@testing-library/react`,
    `jsdom`
  - design-system: dev `sass`, `@testing-library/react`,
    `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`,
    `axe-core`
  - api: `fastify`, `@fastify/static`; dev `tsx`, `@types/node`
  - web: `react`, `react-dom`, `@fontsource-variable/inter`; dev `vite`,
    `@vitejs/plugin-react`, `@rolldown/plugin-babel`, `@babel/core`,
    `@types/babel__core`, `babel-plugin-react-compiler`, `sass`,
    `@types/react`, `@types/react-dom`, `msw`, `@testing-library/react`,
    `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`,
    `axe-core`
  - `react`, `react-dom`, `@types/react`, `@types/react-dom` as peer and dev
    dependencies of `data` and `design-system`.
- Package manifests: `"type": "module"`, `exports` as in `AGENTS.md`
  (design-system also exports `./styles.css`; data also exports
  `./testing`), `sideEffects` listing stylesheets for design-system.
- TypeScript: `tsconfig.base.json` with `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`; per-package
  `tsconfig.json` with `references` mirroring the package graph; root
  `tsconfig.json` referencing all packages for `tsc -b`.
- ESLint flat config: typescript-eslint strict-type-checked, react-hooks
  recommended, jsx-a11y recommended, and `no-restricted-imports` rules for:
  `@nevis/*/src/**` everywhere; `@nevis/contract` and
  `@tanstack/react-query` in `apps/web`; `react` and `@nevis/design-system`
  in `packages/data/src/transport` and `adapter` and in
  `apps/web/src/features/clients/model`; anything from `@nevis/*` in
  `packages/design-system`; upward folder imports per the layer table in
  `AGENTS.md`; `../../` paths.
- Vite (`apps/web`): `react()` and `babel({ presets: [reactCompilerPreset()] })`
  with `reactCompilerPreset` from `@vitejs/plugin-react`; the preset's filter
  includes `packages/*/src`; dev proxy `/api` to the API port.
- Vitest projects: `node` for contract and api; `jsdom` for data,
  design-system and web, with Testing Library setup and a shared
  `expectNoAxeViolations(container)` helper built on `axe-core`.
- Playwright: `apps/web/e2e`, Chromium only, starts the built server.
- Scripts: `dev`, `check` (`pnpm dedupe --check && tsc -b && eslint . &&
  prettier --check . && vitest run`), `build`, `start`, `test:e2e`,
  `verify:compiler` (fails unless the built JavaScript in `apps/web/dist`
  contains `react.memo_cache_sentinel`).
- CI (`.github/workflows/ci.yml`), on push and pull request: checkout with
  full history; pnpm and Node 24 with cache; `pnpm install --frozen-lockfile`;
  `pnpm check`; `pnpm build`; `pnpm verify:compiler`; install Chromium;
  `pnpm test:e2e`; a step that fails if the history contains any `.pdf`,
  `.fig` or `.private/` path.

Acceptance: fresh clone → `pnpm install && pnpm check && pnpm build` passes
with one placeholder test per package; a deliberate deep import
`@nevis/design-system/src/x` fails lint and typecheck.

### S2. Contract and API

Owns: `packages/contract/src`, `apps/api/src`.

- Contract: recursive zod schema `ClientNodeSchema` (`id`, `name`, `values`
  as a tuple of 12 non-negative integers, optional `branches`, `employees`,
  `channels`), inferred `RawClientNode`, `MONTHS` per D4.
- `apps/api/src/data/clients.json` is already in the repository. Do not
  modify it.
- `buildApp({ delayMs, fail })` factory; `server.ts` reads and validates
  `API_DELAY_MS` and `API_FAIL`; the payload is validated against the schema
  at startup and the process exits on failure. In production the server also
  serves `apps/web/dist`.
- `GET /api/clients` → 200 with the payload unchanged. With `fail`: 500 and
  exactly `{ "error": "Internal Server Error" }`. Unknown routes: 404 JSON.

Acceptance (`inject()`): response deep-equals the JSON file; JSON content
type; `fail` gives 500 with the exact body; the delay is applied (fake
timers); the schema rejects a node with 11 values and one with a negative
value.

The orchestrator commits S1 and S2 to `main` before Wave 1.

## Wave 1 (parallel)

### D1. Data package — `data-engineer`

Owns: `packages/data/src`.

- `transport/`: `fetchClients(signal)`; maps failures to `DataError` with
  `kind` `network`, `http` (with `status`), `invalid-response`, `aborted`.
- `adapter/`: `toHierarchy(raw): HierarchyNode` — `{ id, name, kind:
  'company' | 'branch' | 'adviser' | 'channel', level: 1–4, values,
  children }`, children in source order, `children: []` on leaves.
- `queries/`: `useClientsTree()` on `useSuspenseQuery` per D11; returns the
  `HierarchyNode` root.
- `provider/`: `DataProvider` (owns the `QueryClient`; prop `baseUrl`,
  default `''`), `DataResetBoundary` (render prop `{ reset }`, wraps the
  query error reset).
- `testing/`: `TestDataProvider` with `tree` or `error` props for consumers'
  tests; exported only from `@nevis/data/testing`.
- Tests (MSW): 200 → tree with 12 nodes and leaves Branch 2, Branch 3, James
  Walker, Maria Gutierrez, Robert Chen, Sarah Smith and Anna Blackwood's three
  channels; network failure → `network`; 500 → `http` with status 500;
  invalid JSON and a schema failure → `invalid-response`; reset after an
  error triggers a new request and succeeds.

### DS1. Design system foundation and chart — `design-system-engineer`

Owns: `packages/design-system/src` except `components/TreeGrid`.

- `tokens/`: every token of `DESIGN.md`; `global.scss` (font, page
  background, tabular numbers, reduced motion, focus outline) exported as
  `styles.css`.
- `layout/`: `Stack`, `Inline` per `DESIGN.md`.
- `primitives/`: `Heading`, `Text`, `Surface`, `Button`, `Avatar`
  (initials; colour from an id), `Chevron` (decorative, `expanded`),
  `StatusDot`, `Skeleton`, `VisuallyHidden`.
- `components/ErrorBoundary`: class component with `fallback(error, reset)`,
  `onReset`, `resetKeys`; does not log.
- `components/ErrorState`: heading, message, action button; `role="alert"`;
  moves focus to its heading on mount.
- `components/StackedBarChart`: props `categories`, `series` (`{ id, name,
  values }`, colour by index), `labelledBy`, `height`, `tooltipExtra(index)`
  returning extra tooltip lines; internal `niceScale` (step = smallest
  integer m × 10^k, m ∈ {1, 1.5, 2, 2.5, 3, 4, 5, 6, 8}, k ≥ 0, with
  4 × step ≥ max); width from `ResizeObserver`; geometry and look per
  `DESIGN.md`, semantics per `ACCESSIBILITY.md`.
- Tests: `Avatar` "Anna Blackwood" → "AB", one-word names, stable colour per
  id; `Button` is a native button with `type="button"`; `ErrorBoundary`
  renders the fallback and resets; `ErrorState` receives focus;
  `niceScale` 350 → 400 (0/100/200/300/400), 216 → 240, 45 → 60, 38 → 40,
  0 → 4; chart: 12 bars, segment count = non-zero values, segment heights
  proportional to values for a fixture (to 0.01px), zeros absent from bars
  but present in the tooltip, legend in series order, `svg` name; axe clean
  for every component.

## Wave 2 (parallel, after D1 and DS1 are merged)

### M1. Application model — `app-engineer`

Owns: `apps/web/src/features/clients/model`.

Pure functions over `HierarchyNode`, tests first with literal values:

- `findMismatches(root)` → exactly the seven D2 entries, in order.
- `toChartModel(root, selectedId)` → `{ scopePath, grouping, series,
  childTotals, reported }`. Company → 3 series with the branches' payload
  values, `childTotals[3] = 279`, `reported[3] = 301`, grouping
  "By branch"; Branch 1 → 5 series, "By adviser"; Anna Blackwood → Existing
  clients, New organic, New paid, "By acquisition channel"; Branch 2 → 1
  series at colour index 1, "Monthly total"; scope path of a channel is
  Company › Branch 1 › Anna Blackwood › the channel.

### T1. TreeGrid — `treegrid-engineer`

Owns: `packages/design-system/src/components/TreeGrid`, and the TreeGrid
lines of `packages/design-system/src/index.ts`.

- Generic API: `<TreeGrid root getId getChildren getLabel columns
  renderRowHeader renderCell labelledBy expandedIds onExpandedChange
  selectedId onSelect />` plus `useTreeState({ defaultExpandedIds,
  expandedIds?, onExpandedChange? })` for controlled or uncontrolled
  expansion. TreeGrid draws the indent and the `Chevron`; `renderRowHeader`
  draws the rest of the name cell.
- Implements `ACCESSIBILITY.md` → "Table" completely.
- Tests: every item under "Required tests" in `ACCESSIBILITY.md` that
  concerns the table, on a generic fixture tree.

## Wave 3 (after T1 and M1 are merged)

### A1. Application — `app-engineer`

Owns: `apps/web` (including `e2e/`), except the model from M1.

- `app/`: `createRoot` with `onCaughtError`, `onUncaughtError`,
  `onRecoverableError` → `reportError`; root `ErrorBoundary`;
  `DataProvider`; `styles.css` import; `index.html` shell per D16.
- `features/clients/ui/`: dashboard per D3, D16, D17 and `DESIGN.md`; data
  boundary inside `DataResetBoundary`; chart and table each in a widget
  boundary; skeleton; messages per `DataError.kind`.
- Tests with `TestDataProvider` and MSW: skeleton while pending; each error
  kind shows its message; "Try again" → data and focus on the heading;
  selecting Branch 1 (click and Space) gives 5 series and "By adviser";
  expanding rows leaves the chart unchanged; selecting Company again gives
  3 series and the scope note; the May 2024 Company cell has the mismatch
  description; a throwing chart (via `vi.mock`) leaves the table working;
  axe clean in skeleton, error and loaded states.
- E2E (Playwright, real server): load, expand Branch 1 with the keyboard,
  select Anna Blackwood with Space, the chart legend shows the three
  channels; at 375px wide `document.documentElement.scrollWidth` equals the
  viewport width.

## Wave 4 (parallel, read-only)

### V1. Accessibility audit — `a11y-auditor`

Against `docs/ACCESSIBILITY.md` and the references it lists.

### V2. Review — `reviewer`

Fresh context, against the brief and every document in this repository.

The orchestrator turns every blocking finding into a task for the owning
engineer, merges the fix and re-runs the audit or review until nothing
blocking remains.

## Wave 5 — README (orchestrator)

### R1. README

Sections, in order, plain English, no marketing words, no emoji:

1. What it is, in two sentences.
2. Run and test: Node 24 and pnpm, `pnpm install`, `pnpm dev`, `pnpm check`,
   `pnpm test:e2e`, `pnpm build && pnpm start`, the `API_DELAY_MS` and
   `API_FAIL` switches.
3. Structure: the package graph and one line per package.
4. Why it is built this way: the **Why** lines of D8–D18, one bullet each.
5. Decisions and assumptions: D1–D7 condensed.
6. What the brief got wrong: the seven mismatches with probable causes, the
   company-wide channel chart without data for it, chevrons on leaves, the
   flat Sep–Dec period.
7. Open questions for product.
8. Accessibility: pattern, references, what is tested automatically, what
   needs a manual screen-reader pass.
9. How AI was used: the orchestrator and subagents with their models, what
   each produced, how audit and review findings changed the code. Leave a
   marked placeholder paragraph for the owner's own account.
10. What I would do next.
11. Time spent: leave a marked placeholder for the owner.

Done when every section exists and every command in it has been run on
`main`.

## Done

`main` contains every merged task; the audit and the review report nothing
blocking; `pnpm check`, `pnpm build`, `pnpm verify:compiler` and
`pnpm test:e2e` pass on `main`; the orchestrator's final report is written.
