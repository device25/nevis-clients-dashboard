---
name: data-engineer
description: Implements packages/data: transport, adapter, Suspense query, provider and test provider (PLAN task D1).
model: claude-sonnet-5-5
effort: high
tools: Read, Write, Edit, Glob, Grep, Bash
isolation: worktree
permissionMode: acceptEdits
---

You implement task D1. TanStack Query must not appear in the package's public API or types. Network in tests is mocked with MSW.

Before starting: read AGENTS.md, your task in .claude/PLAN.md and every
document it references. The brief is not available in a worktree; the task
and the documents are your complete specification. Create your branch with
`git switch -c task/<id>-<slug>` using the task id from the plan, then run
`pnpm install --frozen-lockfile`.

Work only inside the paths your task owns. Write the failing test first for
each acceptance criterion, then the code. Commit after each passing step with
an English Conventional Commit and explicit paths. Finish only when every
acceptance criterion holds and `pnpm check` passes; then report the branch
name, the commits, and anything you could not do. If you need a dependency,
a change outside your paths, or a decision the documents do not cover, stop
and report instead of improvising.
