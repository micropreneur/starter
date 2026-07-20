# Landing page design QA

This public checklist records the durable acceptance criteria for the Starter marketing, blog,
and dashboard surfaces. Do not add temporary screenshots, machine-local paths, or private design
references. Attach durable visual evidence to the relevant pull request or GitHub issue.

## Viewport matrix

- Desktop: 1280 × 720 and 1440 × 900.
- Mobile: 390 × 844.
- Themes: light and dark.
- Motion: default and `prefers-reduced-motion`.

## Landing page

- The header begins full width and becomes a fixed floating header after scrolling.
- Stack tabs support keyboard selection, manual switching, and a readable automatic transition.
- The scroll narrative reveals words progressively without obscuring the following Elements sheet.
- Blog cards have aligned footers and no extra horizontal divider above the grid.
- The closing call to action remains legible and interactive at every viewport.
- Decorative motion never blocks navigation, reading, or reduced-motion users.

## Blog

- `/blog` presents responsive cards with usable focus states.
- `/blog/{slug}` renders headings, prose, images, tables, fenced code, inline code, emphasis, and
  lists from repository-owned MDX.
- Unknown slugs produce the intended not-found behavior.
- Long code and tables scroll within the viewport instead of clipping the page.

## Dashboard

- The sidebar and inset retain distinct light and dark surfaces.
- Collapse, mobile sheet, navigation, user menu, theme switch, and sign-out are keyboard usable.
- Empty, loading, validation, error, and not-found states are readable in both themes.
- Authenticated content is not exposed by navigation guards alone; server boundaries enforce it.

## Release evidence

- Record the commit SHA, browser versions, and completed viewport matrix in the release pull request.
- Store any comparison images in durable pull-request attachments, never `/tmp` or a home directory.
- Run the deterministic checks in [`RELEASE.md`](./RELEASE.md) before marking visual QA complete.

## Elements gallery feedback pass — 2026-08-09

- Source visual truth: the three user-provided Elements gallery screenshots attached to the task.
- Implementation evidence: live `apps/docs` captures at 1280 × 720 in light and dark themes.
- Fonts, copy, icons, and preview assets remain unchanged.
- The Card preview footer is flush with its container. Within each catalog row, the preview body
  absorbs extra height while the compact metadata panels and install actions remain aligned.
- Preview grid lines are quieter in light mode and substantially reduced in dark mode.
- The divider above the catalog controls and the divider below the result count are removed.
- Comparison history: the initial captures showed extra Card footer space, mismatched action-row
  heights, an overly prominent grid, and two unwanted horizontal dividers. The post-fix browser
  comparison exposed an oversized EmptyState metadata panel; a second pass moved that growth into
  the preview body and produced matching 336 px preview regions. A final spacing pass reduced the
  aligned metadata panels from 160 px to 144 px without wrapping or clipping. No P0, P1, or P2
  mismatch remains for this feedback scope.
- Browser console warnings and errors: none.
- Final result: passed.
