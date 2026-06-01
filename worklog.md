# Worklog

## Task 2-a: Fix Y-position desync bugs in demo PDF route

**File:** `src/app/api/export/demo/[type]/route.ts`
**Date:** 2025-07-09
**Status:** Done

### Problem
The PDF utilities in `pdf-utils.ts` were updated so that `checkNewPage()` and `addSpacing()` now **return** the Y position. The route file was not updated to capture these return values, causing the Y cursor (`y`) to desync from the actual `doc.y` after page breaks or spacing operations. This produced empty/blank pages in generated PDFs.

### Changes Applied
Across all 8 PDF builder functions and 2 rendering helpers, the following transformations were applied:

#### Rule 1 — checkNewPage calls
`checkNewPage(doc, N)` → `y = checkNewPage(doc, N, y)` (every occurrence)

#### Rule 2 — addSpacing calls
`addSpacing(doc, N)` → `y = addSpacing(doc, N, y)` (every occurrence)

#### Rule 3 — addSectionHeader without y param
`y = addSectionHeader(doc, 'Title')` → `y = addSectionHeader(doc, 'Title', y)` (every assignment)

#### Rule 4 — First addSectionHeader after drawCoverPage
Kept as `let y = addSectionHeader(doc, 'Title')` since `drawCoverPage` resets `doc.y` via the pageAdded event.

### Functions modified
| Function | checkNewPage fixes | addSpacing fixes | addSectionHeader fixes |
|---|---|---|---|
| `buildKiviatPdf` | 7 | 7 | 7 |
| `buildTremplinPdf` | 4 | 5 | 4 |
| `buildCreaSimPdf` | 7 | 8 | 7 |
| `buildParcoursPdf` | 7 | 8 | 8 |
| `buildBmcPdf` | 2 | 3 | 3 |
| `renderMarkdownContent` | 2 | 0 | 0 |
| `renderStructuredContent` | 5 | 0 | 0 |
| `buildBusinessPlanPdf` | 8 | 6 | 7 |
| `buildFallbackPdf` | 0 | 2 | 2 |
| **Total** | **42** | **39** | **38** |

### Verification
- Lint passes cleanly (`bun run lint` — zero errors)
- Grep confirms zero remaining bare `checkNewPage(doc,` or `addSpacing(doc,` calls
- Grep confirms zero remaining `y = addSectionHeader(doc, '...')` without y param
- Only the 7 initial `let y = addSectionHeader(doc, ...)` declarations remain (correct per Rule 4)
- Function signatures and imports were not changed
