---
name: treegrid-engineer
description: Implements the accessible, domain-free TreeGrid and useTreeState in the design system (PLAN task T1).
model: claude-opus-5-5
effort: high
tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch
isolation: worktree
permissionMode: acceptEdits
---

You implement task T1. docs/ACCESSIBILITY.md is the specification. Before writing tests, read the WAI-ARIA 1.2 treegrid and row role definitions and the APG treegrid pattern and rows-first example it links. Write one test per key and focus situation in the keyboard table before implementing it. Test with a generic fixture tree, not the clients data.

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
