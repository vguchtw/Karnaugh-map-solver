# 2026-10-26 — Visible Gray-code axis headers

Project: `vguchtw/Karnaugh-map-solver` (standalone non-trading demo).
Parent: draft PR #8 at `a3e4ace14946474d2b925b0814ec1112ced88838`.
Branch: `fix/gray-axis-headers-20261026`.

## Defect and scope
The 2–6-variable Karnaugh map rendered only unlabeled 0/1 data cells. Without visible row/column Gray-code coordinates or variable grouping, a user could not reliably associate a selected cell with its input minterm from the visual map. Existing ARIA labels were available only to assistive technology.

Add a noninteractive top header row and row header cells. The upper-left header identifies row/column variable groups; column and row labels follow the existing Gray-code order. Preserve existing minterm mapping, keyboard/mouse interactions, exact SOP/POS minimization, and mobile horizontal scrolling.

## Test-first and qualification
- On the unchanged PR #8 solver, two new regression cases **failed** and five existing keyboard cases **passed**. Failures: missing header row (2 vs 3 rows for 2-variable map), first cell was `td` instead of `th`.
- After implementation, VGM-Edge Node.js 22.23.4: **15/15** full dependency-free Node tests passed, zero skipped. The new cases verify Gray-code header order and exact minterm association for 2, 3, 4, 5 and 6 variables, noninteractive headers, and preserved cell toggling.
- Existing optional Chrome mobile acceptance extended to assert four-/six-variable axis headers at 320/375/767/768/1024 px. Requires Chrome + separately installed Puppeteer. Browser acceptance pending independent execution.
- `node --check tests/mobile-browser.acceptance.cjs` and `git diff --check` passed.
- No production deployment. No APP-Ink/Project Orchestrator or trading code touched.

## Release
**KEEP DRAFT / RETEST** pending independent browser/mobile accessibility verification, hosted CI and review of stacked PR chain #6 → #7 → #8. Do not merge or deploy without explicit release approval. Rollback: close the unmerged PR / delete its isolated branch.

## NEXT_ACTION
Verify exact published SHA on Windows Chrome + Node, run full Node suite and optional mobile browser acceptance, then inspect hosted CI.
