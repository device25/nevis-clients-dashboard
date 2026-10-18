# Visual specification

Measured in Figma Dev Mode, file `t6itC2qsmr3WLPugwrVdqS` (linked in the
brief): main screen `Mockup 2` (node `1-2781`, 1440 × 900); components
`Row`, `Row name`, `Table · First and second levels`, `Table · Third level`.
Items marked *(not in the design)* are our additions; everything else is
the design.

Every value below is a token in `packages/design-system/src/tokens/`.
Components use tokens only. Token names follow the Figma variables where
they exist.

## Tokens

| Token | Figma variable | Value |
|---|---|---|
| `--color-background-primary` | Background/Primary | `#F7F5ED` |
| `--color-background-secondary` | Background/Secondary | `#FFFFFF` |
| `--color-content-primary` | Content/Primary | `#141413` |
| `--color-content-secondary` | Content/Secondary | `rgb(20 20 19 / 60%)` |
| `--color-line-dotted` | Outline/Line dotted | `rgb(20 20 19 / 16%)` |
| `--color-line-solid` | Outline/Line solid | `rgb(20 20 19 / 8%)` |
| `--color-surface-hover` | Surface/Secondary | `rgb(20 20 19 / 4%)` |
| `--color-surface-selected` | *(not in the design)* | `rgb(20 20 19 / 7%)` |
| `--color-focus` | *(not in the design)* | `#3B5BDB` |
| `--color-warning` | *(not in the design)* | `#C2410C` |
| `--color-chart-1` | Existing clients | `#B29DF8` |
| `--color-chart-2` | New organic | `#F4BEB4` |
| `--color-chart-3` | New paid | `#A75E6E` |
| `--color-chart-4`, `-5` | *(not in the design)* | `#7FC8B4`, `#4F6BB0` |
| `--color-avatar-1` … `-4` | *(not in the design)* | `#B29DF8`, `#F4BEB4`, `#7FC8B4`, `#E9D48A`; text `--color-content-primary` |
| `--radius-card` | | `8px` |
| `--radius-bar` | | `4px` |
| `--radius-swatch` | | `2px` |
| `--space-1` … `--space-6` | | `4px`, `8px`, `12px`, `16px`, `24px`, `32px` |
| `--font-title` | Title | Inter Display, 400, 35px, line height 125% |
| `--font-body` | Body | Inter, 400, 14px / 20px |
| `--font-footnote` | Footnote | Inter, 400, 12px / 16px |

Fonts come from `@fontsource-variable/inter`. Inter Display is Inter's
display optical size: the title uses the variable font's `opsz` axis
(`font-optical-sizing: auto`). If the installed package has no `opsz` axis,
use Inter for the title and record the difference in `DECISIONS.md`.

Numbers in the table and on the axes use `font-variant-numeric:
tabular-nums lining-nums`.

## Layout primitives

- `Stack` — vertical flex, `gap` ∈ `1`…`6` mapped to `--space-*`, optional
  `align`.
- `Inline` — horizontal flex, same `gap`, optional `align` and `wrap`.
- Classes for every gap value are generated once from the spacing tokens.

## Page

- Background `--color-background-primary`.
- Content column: padding 24px top and bottom, 16px left and right; vertical
  stack with 16px gap: title, chart card, table card.
- Title "Clients": `Heading` level 1, `--font-title`,
  `--color-content-primary`, height 44px.
- Cards: `Surface` — `--color-background-secondary`, `--radius-card`, no
  shadow, full width (1408px at 1440).

## Chart card

- Padding 24px top, 16px right, bottom and left. Vertical stack with 16px gap:
  plot area (358px tall), legend (16px tall). Total height 430px.
- *(Not in the design)* Above the plot, inside the top padding: scope path
  and grouping caption in `--font-footnote`, `--color-content-secondary`, the
  current node in `--color-content-primary`. The card grows by their height.
- Plot area, inside the card's content box: the chart group starts 38px from
  the left and 10px from the top and is 1338px wide.
  - Y-axis labels: a 26px-wide column left of the group, right-aligned,
    `--font-footnote`, `--color-content-secondary`, tabular; 5 labels
    (0 to max) spaced evenly over the grid height.
  - Grid: 5 horizontal lines spaced evenly over 320px, 1px dashed with
    dashes `1, 6` (round caps), `--color-line-dotted`. No axis lines.
  - Bars: 12 columns, each 87.5px wide, 24px apart, with 12px padding at both
    ends of the row (12 + 12 × 87.5 + 11 × 24 + 12 = 1338). Bar heights
    scale to the grid. Each column is clipped as one shape with
    `--radius-bar` on all four corners; segments are stacked with no gap.
    Series order bottom to top = source order; colours `--color-chart-1` …
    `-5` by index.
  - X-axis labels: one per column, same 87.5px width and 24px gap, centred,
    `MMM YYYY`, `--font-footnote`, `--color-content-secondary`, tabular;
    12px below the grid.
- Legend: horizontal row centred under the plot, 16px between items. Item:
  8 × 8px swatch with `--radius-swatch`, 4px gap, label in `--font-footnote`,
  `--color-content-secondary`.
- *(Not in the design)* Scope note at Company scope: one line centred under
  the legend, `--font-footnote`, `--color-content-secondary`.
- *(Not in the design)* Hover on a month: a `--color-surface-hover` band
  behind the column and a tooltip (`--color-background-secondary`,
  `--radius-card`, 1px `--color-line-solid` border, 12px padding,
  `--font-footnote`) beside the column, flipped to the left in the right half
  of the plot. Content: month; one line per series with swatch, name and
  value, zeros included; a divider; "Children total"; "Reported total" only
  when it differs.

## Table card

- No padding; rows stack with no gap. Every row, header included, is 56px
  tall with a 1px `--color-line-solid` bottom border.
- Row layout: horizontal, padding 16px left and 24px right, 18px top and
  bottom (16px for the header row), 16px gap between cells.
- Columns at 1440: name column 264px; 12 month columns of 76px. With the
  16px gaps: 16 + 264 + 12 × (16 + 76) + 24 = 1408.
- Header: empty name cell; month labels `--font-body`,
  `--color-content-secondary`, right-aligned.
- Month cells: `--font-body`, `--color-content-primary`, right-aligned,
  tabular, vertically centred.
- Name cell (`Row name`): horizontal, 8px gap, 20px tall.
  - Indent (left padding): Company 0, branch 28px, adviser 56px, channel
    108px. A channel has no chevron and no avatar, so its label lines up
    with the adviser's name.
  - Chevron: 16 × 16px icon, `--color-content-primary`; pointing right when
    collapsed, down when expanded. Rows without children have no chevron
    *(D5)*; their 16px slot stays empty so names line up.
  - Avatar: 20px circle, advisers only.
  - Label: `--font-body`, `--color-content-primary`.
- Row states: default `--color-background-secondary`; hover
  `--color-surface-hover` (Figma "On hover"); *(not in the design)* selected
  `--color-surface-selected` with a 3px `--color-content-primary` bar on the
  leading edge; *(not in the design)* focus: 2px `--color-focus` outline
  inset by 2px on the focused row or cell.
- *(Not in the design)* Mismatch cell: 6px `StatusDot` in `--color-warning`,
  4px before the number.
- Initial state: Company expanded *(design)* and selected *(D3)*, everything
  else collapsed.

## Loading and errors *(not in the design)*

- Skeleton: same cards and sizes as the loaded page; columns and rows as
  `--color-line-solid` blocks; fades in after 150ms; no animation under
  `prefers-reduced-motion: reduce`.
- `ErrorState`: centred in its container; heading `--font-body` weight 600,
  message `--font-body` `--color-content-secondary`, `Button` below, 16px
  gaps.

## Narrow screens *(not in the design)*

- Below 640px: content padding 12px; title 28px; chart plot 220px tall;
  Y-axis column 24px; bars share the width evenly with 4px gaps; month labels
  `MMM` only, with the year under Feb 2024 and Jan 2025; legend wraps.
- Table scrolls horizontally inside its card; the name column is sticky at
  160px with a 1px `--color-line-solid` right edge; indent steps halve
  (0, 14, 28, 54px).
- At 375px wide the page never scrolls horizontally.
