# AGENTS.md

Canonical instructions for every agent in this repository. `CLAUDE.md` only
imports this file.

## What to build

The requirements are the assignment brief at `.private/brief.pdf`. The
orchestrator, the `scaffolder`, the `a11y-auditor` and the `reviewer` run in
the main checkout and read it in full before any work. Engineers run in
worktrees, where the git-ignored `.private/` folder does not exist; their
task in `.claude/PLAN.md` and the documents below are their complete
specification. Never copy the brief or any part of its text into a tracked
file, except the data payload, which already lives in
`apps/api/src/data/clients.json`.

Specifications that turn the brief into decisions:

- `docs/DECISIONS.md` — product and technical decisions. Final.
- `docs/DESIGN.md` — visual specification.
- `docs/ACCESSIBILITY.md` — accessibility specification.
- `.claude/PLAN.md` — tasks, their order, owners and acceptance criteria.

## Sources of truth

1. `apps/api/src/data/clients.json` is the payload as given. Never edit,
   normalise, reconcile or re-order it.
2. `docs/DECISIONS.md` and `docs/ACCESSIBILITY.md` define behaviour.
3. `docs/DESIGN.md` defines appearance. If the Figma file linked in the brief
   is reachable through a tool, confirm values there; where Figma and
   `DESIGN.md` differ on appearance, Figma wins and the difference is
   recorded in `DECISIONS.md`. Numbers shown in Figma are never data.

If two sources conflict on behaviour, stop and report the conflict.

## How the work runs

The main session is the **orchestrator**. It does not write product code. It:

1. Runs the `scaffolder` on `main` and commits the result to `main`.
2. Starts the tasks of each wave in `.claude/PLAN.md` in parallel, each with
   the subagent the plan names. Engineers run in their own git worktree. A
   worktree starts from `main`, so everything a task depends on must be
   merged into `main` before that task starts.
3. Merges each finished task branch into `main` with `git merge --no-ff`
   after `pnpm check` passes on the branch, and runs `pnpm check` again on
   `main` after the merge.
4. Sends every blocking finding of an audit or review back to the owning
   engineer as a new task, merges the fix, and re-runs the audit or review
   until nothing blocking remains.
5. Writes `README.md` (task R1) and stops with a final report: what was
   built, every finding with its verdict (fixed / rejected with reason), and
   anything left undone. It never pushes.

Subagents never spawn other agents. A subagent works only inside the paths
its task owns. A subagent that needs a change outside its paths, a new
dependency, or a decision the documents do not cover stops and reports back
instead of improvising.

## Agents

| Agent | Model | Effort | Writes | Runs in |
|---|---|---|---|---|
| orchestrator (main session) | Opus 5.5 | xhigh | merges, `README.md` | `main` |
| `scaffolder` | Sonnet 5.5 | medium | tooling, `contract`, `apps/api`, CI | `main` |
| `data-engineer` | Sonnet 5.5 | high | `packages/data` | worktree |
| `design-system-engineer` | Sonnet 5.5 | high | `packages/design-system` except `TreeGrid` | worktree |
| `treegrid-engineer` | Opus 5.5 | high | `packages/design-system/src/components/TreeGrid` | worktree |
| `app-engineer` | Sonnet 5.5 | high | `apps/web`, e2e test | worktree |
| `a11y-auditor` | Opus 5.5 | high | nothing (read-only) | `main` |
| `reviewer` | Fable 5.1 | high | nothing (read-only) | `main` |

Definitions live in `.claude/agents/`.

## Packages

```
apps/web ──► @nevis/data ──► @nevis/contract ◄── apps/api
   └───────► @nevis/design-system
```

| Package | Path | Public API (`src/index.ts` only) | Hidden |
|---|---|---|---|
| `@nevis/contract` | `packages/contract` | `ClientNodeSchema`, `RawClientNode`, `MONTHS`, `Month` | — |
| `@nevis/data` | `packages/data` | `DataProvider`, `useClientsTree`, `DataResetBoundary`, `DataError`, `HierarchyNode`, `NodeKind`; subpath `@nevis/data/testing` with `TestDataProvider` | fetch, schema validation, adapter, query keys, `QueryClient`, TanStack Query itself |
| `@nevis/design-system` | `packages/design-system` | `Stack`, `Inline`, `Heading`, `Text`, `Surface`, `Button`, `Avatar`, `Chevron`, `StatusDot`, `Skeleton`, `VisuallyHidden`, `ErrorState`, `ErrorBoundary`, `TreeGrid`, `useTreeState`, `StackedBarChart` and their prop types; subpath `@nevis/design-system/styles.css` | SCSS modules, token files, internal hooks |
| `api` | `apps/api` | `GET /api/clients` | — |
| `web` | `apps/web` | the application | — |

Rules:

- Dependencies point only along the arrows. No cycles. `apps/web` never
  imports `@nevis/contract` or `@tanstack/react-query`. `apps/api` and
  `apps/web` never import each other.
- `@nevis/design-system` knows nothing about clients. `@nevis/data` knows
  nothing about UI.
- Packages are consumed from source: `exports` points at `src/index.ts`.
  No build step, no publishing.

## Dependencies

External (npm):

- Versions are declared once in the pnpm catalog in `pnpm-workspace.yaml`;
  packages reference them as `"catalog:"`.
- `react` and `react-dom` are `peerDependencies` of the packages (and
  `devDependencies` for their tests) and `dependencies` of `apps/web` only.
- `@tanstack/react-query` is a dependency of `@nevis/data` only.
- `zod` is a dependency of `@nevis/contract` only.
- Shared tooling lives in the root `devDependencies`.
- Only the `scaffolder` adds dependencies, and only those listed in
  `.claude/PLAN.md` task S1. Nobody else edits a `package.json` or the
  lockfile.

Internal (workspace): `"workspace:*"`, TypeScript project references
mirroring the package graph, `exports` maps that expose only `index.ts`.

Inside a package: modules are layered and import only downward; across
modules only through the module's `index.ts`; no `../../` paths.

| Package | Layers, top to bottom |
|---|---|
| `design-system/src` | `components/` → `layout/`, `primitives/` → `tokens/` |
| `data/src` | `provider/` → `queries/` → `adapter/` → `transport/` |
| `apps/web/src` | `app/` → `features/clients/ui/` → `features/clients/model/` |
| `apps/api/src` | `server.ts` → `app.ts` → `routes/` → `data/` |

Checks in `pnpm check`: `pnpm dedupe --check`; `tsc -b`; ESLint
`no-restricted-imports` rules for deep package imports, forbidden packages
per workspace, and upward imports per folder.

## Commands

| Command | Meaning |
|---|---|
| `pnpm dev` | API and web together; Vite proxies `/api` |
| `pnpm check` | dedupe check, typecheck, lint, format check, unit and component tests — the definition of done |
| `pnpm test:e2e` | build, start the server, run the Playwright test |
| `pnpm build` | production build |
| `pnpm start` | run the built API, which also serves the built web app |

## Rules for code

- A task is done only when its acceptance criteria hold and `pnpm check`
  passes in its worktree.
- Write the failing test first for every behaviour in a task's acceptance
  criteria, then the code. One test per criterion; no snapshot tests.
- Tests assert what a user or assistive technology observes: roles, names,
  ARIA states, text, focus. Expected numbers are literals from the payload,
  never recomputed by the code under test.
- Network in tests is mocked with MSW, never by replacing `fetch`.
- No test-only props, routes, flags or branches in production code.
- Colours, spacing, radii and type come from design-system tokens. `apps/web`
  contains no stylesheets except the page shell in `index.html`.
- No `any`, no non-null assertions, no `eslint-disable` without a comment
  stating why.
- No `useMemo` or `useCallback` for performance: the React Compiler handles
  memoisation. Use them only where referential identity is part of a public
  contract, with a comment.
- Code comments explain why, not what.

## Rules for git

- Commit after every passing step: Conventional Commits, English, imperative
  subject (`feat(treegrid): move focus to the parent row on ArrowLeft`).
- Stage explicit paths. Never `git add -A`.
- Never commit anything under `.private/`, design exports or screenshots,
  `.env` files, `node_modules`, build output.
- Task branches are named `task/<id>-<slug>`, for example `task/D1-data`.
- Never push, rebase, reset or force anything.
