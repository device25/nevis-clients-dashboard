# Accessibility specification

Target: WCAG 2.2 level AA.

## Normative references

Read the relevant parts before writing code or tests. Where this file and a
reference disagree, the reference wins and the difference is reported.

- WAI-ARIA 1.2, W3C Recommendation — https://www.w3.org/TR/wai-aria-1.2/
- ARIA Authoring Practices Guide — https://www.w3.org/WAI/ARIA/apg/
  - Treegrid pattern — https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/
  - Treegrid example, rows-first navigation —
    https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/
- Accessible Name and Description Computation 1.2 —
  https://www.w3.org/TR/accname-1.2/
- Core Accessibility API Mappings 1.2 — https://www.w3.org/TR/core-aam-1.2/
- HTML Accessibility API Mappings 1.0 — https://www.w3.org/TR/html-aam-1.0/
- SVG Accessibility API Mappings 1.0 — https://www.w3.org/TR/svg-aam-1.0/
- WCAG 2.2 — https://www.w3.org/TR/WCAG22/
- Overview of the ARIA specifications —
  https://www.w3.org/WAI/standards-guidelines/aria/

## Table: treegrid, rows first

Markup: native `<table role="treegrid">`, labelled by the "Clients" heading
through `aria-labelledby`. Header row of `columnheader` cells: an empty first
header, then one per month. Body rows have `role="row"`; the first cell of
each body row is a `<th scope="row">` (`rowheader`) with the node name; month
cells are `gridcell`s. Single-select: `aria-multiselectable` is absent.

| Attribute | Rule |
|---|---|
| `aria-level` | 1 Company, 2 branches, 3 advisers, 4 channels |
| `aria-setsize`, `aria-posinset` | Number of siblings and 1-based position among them |
| `aria-expanded` | `true`/`false` only on rows with children; absent on every leaf |
| `aria-selected` | `true` on the selected row, `false` on every other body row |
| `tabindex` | `0` on exactly one element of the grid (the focused row or cell), `-1` on every other body row and cell; header cells have none |

Collapsed descendants are not rendered. `aria-rowcount` and `aria-rowindex`
are not used.

Keyboard — rows first, as in the APG example:

| Key | Focus on a row | Focus on a cell |
|---|---|---|
| ArrowDown / ArrowUp | Next / previous visible row; stops at the ends | Same column in the next / previous visible row; stops at the ends |
| ArrowRight | Collapsed parent: expands, focus stays. Expanded or leaf: first cell of the row | Next cell; stops at the last cell |
| ArrowLeft | Expanded: collapses, focus stays. Collapsed or leaf: parent row; nothing on Company | First cell: its row. Other cells: previous cell |
| Home / End | First / last visible row | First / last cell of the row |
| Ctrl+Home / Ctrl+End | First / last visible row | Same column in the first / last visible row |
| PageDown / PageUp | 10 rows down / up, clamped | Same, in the same column |
| Enter | Parent row: toggles expansion. Leaf: nothing | Same as on its row |
| Space | Selects the row | Selects the cell's row |
| Tab | Leaves the grid | Leaves the grid |

Pointer: clicking the chevron toggles expansion and focuses the row; clicking
anywhere else on a row selects and focuses it. The chevron is decorative
(`aria-hidden="true"`); expansion state is exposed by `aria-expanded`.

The focused element is scrolled into view inside the table's scroll
container. When collapsing a row hides the focused element, focus moves to
the collapsed row. Re-expanding a row restores its descendants' previous
expansion.

Mismatch cells carry `aria-describedby` pointing to visually hidden text,
for example "Reported 301, children add up to 279."

## Chart

- The `<svg>` has `role="img"` and its name from `aria-labelledby`: the scope
  path, the grouping and a summary, for example "Company, by branch, Feb 2024
  to Jan 2025, between 250 and 350 a month." The range is the minimum and
  maximum of the stack totals.
- Everything inside the SVG is `aria-hidden="true"`.
- The legend is an HTML list outside the SVG; the scope note is a paragraph.
- The table is the accessible data view of the chart. The tooltip is pointer
  only and repeats data the table exposes.

## Page, loading and errors

- One `<h1>` "Clients"; the chart and the table are `<section>`s labelled by
  visually hidden headings "Chart" and "Table".
- Skeleton: the dashboard region has `aria-busy="true"`. An element with
  `role="status"` outside that region, present from the first render, holds
  the text "Loading clients" while the skeleton shows and is empty otherwise
  (D24).
- Data and widget errors: `ErrorState` has `role="alert"`, a heading, the
  message and a native "Try again" button; when it appears, focus moves to
  its heading (`tabindex="-1"`).
- After a successful retry, of the data or of a widget, focus moves to the
  "Clients" heading.
- Root error page: heading, message, "Reload" button; focus on the heading.

## Visual

- Focus indicator on every focusable element: at least 2px, contrast at
  least 3:1 against adjacent colours; never hidden by sticky content
  (WCAG 2.2 Focus Not Obscured).
- Text contrast at least 4.5:1; large text 3:1.
- Series are identified by legend order, the tooltip and the table, never by
  colour alone (the design stacks segments without gaps).
- `prefers-reduced-motion: reduce` disables transitions and the skeleton
  fade.
- At 375px nothing overflows the viewport; the table scrolls inside its own
  container.

## Required tests

- Every key in the keyboard table, from a row and from a cell where the
  table distinguishes them, asserting the focused element and ARIA state.
- `aria-level`, `aria-setsize`, `aria-posinset` on every row of the fully
  expanded tree; `aria-expanded` absent on all nine leaf rows.
- Exactly one `tabindex="0"` in the grid after every interaction test.
- Focus recovery after collapsing an ancestor of the focused row.
- Focus moves to the error heading when an error appears.
- axe-core reports no violations on: skeleton, data error, widget error,
  collapsed table, fully expanded table, chart at Company scope, chart at
  Anna Blackwood scope.
