# Karnaugh standalone solver — responsive phone acceptance (2026-10-14)

## Scope and dependency

Non-trading, source-only follow-up to [draft PR #7](https://github.com/vguchtw/Karnaugh-map-solver/pull/7) on `fix/keyboard-accessible-map-cells-20261014` at exact parent commit `07045de010dd1ba11a15df3640bc8af211bc9810`. Branch `fix/responsive-phone-kmap-20261014`, created as a fresh, isolated VGM-Edge clone, with independent Chrome verification on VGM-Desktop.

This increment updates responsive HTML/CSS, adds two regression test files and README/evidence. **No Boolean minimization algorithm, term selection, parsing, production website, WordPress or trading system changes.**

## Original defect and test-first evidence

The page carried a `@media (max-width: 767px)` rule that applied `display: none` to all `.karnaugh-solver` direct children except `.mobile-fallback`. Mobile users only saw a warning telling them to rotate or use a larger device. This hides every actual solver control, 2–6 variable selection, result, and the keyboard-accessible map on common phones.

Before the patch:
- Fresh PR #7 checkout with three new dependency-free `tests/mobile-layout.test.cjs` cases: **11/13 Node cases passed; 2 new mobile cases failed**, showing the responsive suppression and absent horizontal map scroller.
- Real Windows Google Chrome 155.0.8059.40 / Puppeteer 25.12.0 running new `tests/mobile-browser.acceptance.cjs`: **FAIL at 320px**, because the settings are not visible (assertion `320px: settings must be visible`).

## Narrow responsive correction

- Remove the unsupported-phone fallback message and the CSS which hid the interactive solver below 768px.
- Keep the solver available from **320px** through standard desktop widths, with tighter page/card spacing and mobile-friendly cell targets below 768px.
- Add a **local** `overflow-x: auto` scroll region around the map itself; for a 320px viewport the 8-column/64-cell map can extend horizontally without widening the page. `overscroll-behavior-x: contain` keeps horizontal gestures localized.
- Explain touch activation and horizontal map swiping in the on-page instructions.
- Preserve the solver JavaScript, Gray-code minterm mapping, expression/diagram/code output, exact Boolean minimization algorithm and all original keyboard accessibility behavior.

## Independent regression and real-browser results

After the fix:

- **VGM-Edge Linux Node.js 22:** full dependency-free `node --test tests/*.test.cjs` **13/13 PASS**, 0 skipped.
- **VGM-Desktop Windows Node.js 24.19.0:** same complete Node suite **13/13 PASS**, 0 skipped.
- **Independent Chrome 155.0.8059.40 / Puppeteer 25.12.0:** **5/5 viewport checks PASS** for widths **320, 375, 767, 768, 1024px**. Verified visible settings, map, expression; 16-cell default and 64-cell six-variable map; mouse click; keyboard Space; real emulated touchscreen taps at 320 and 375px; no document-wide horizontal overflow; and locally scrollable 8-column map at 320px.
- At 320px: `#kmap-container.clientWidth=270px`, table scroll width **289px**, document scroll width **320px** equal to viewport; `overflow-x:auto`. At 375px the full six-variable map fits inside the available scroll container, and at larger viewports 64 cells remained accessible.
- Existing independent Chrome keyboard acceptance `node tests/keyboard-browser.acceptance.cjs`: **PASS**, including visible focus, Tab, Space/Enter, checked-state synchronicity, mouse compatibility and 16/64 unique minterm labels; **zero uncaught JavaScript errors**.
- New responsive Chrome acceptance produced zero page errors at every tested width. Chrome profile is disposable and deleted by the script. There are **no** external requests or package installs.
- `node --check`, `git diff --check`: PASS.

## Acceptance and boundaries

**KEEP DRAFT.** Requiring real Android/iOS browser and assistive screen-reader/manual acceptance before any production deployment is reasonable; desktop Chrome mobile emulation is strong functional evidence but not device-hardware acceptance. User tap/swipe screen usability, WCAG review, actual production publication, and GitHub PR dependency review are separate gates. PR #7 in turn depends on PR #6, so review in order **#6 → #7 → mobile follow-up**.

This is a public GitHub repository: earlier PR #7 GitHub-hosted Node.js 22/24 CI actually executed and passed. Unlike private VGM repositories, public GitHub CI is not currently blocked by the private Actions billing/spending-limit issue. Require the new PR's own CI jobs to execute and pass; do not infer from local tests alone.

No production GitHub merge/deployment, user files, model access, media processing, or trading activity took place.
