# Exact prime-implicant cover correction — 2026-10-13

**Project:** `vguchtw/Karnaugh-map-solver`

**Base:** branch `fix/minimal-prime-cover-20261012`, commit `e924a4ebee42119f5904f12f7e762b0a6a4826ac`, which preserved failing regression tests independently of the source implementation.

## Reproduced defect

The previous widest-implicant greedy selector emitted five SOP terms on the
4-variable on-set `[1,2,4,5,6,8,9,10]` although four suffice. Its result also
failed an independent combinatorial optimum comparison (term and literal
counts). The user interface previously displayed valid but non-minimal
expressions.

## Isolated implementation

- Retain existing prime implicant generation and rendering (SOP/POS).
- Select mandatory essential implicants first.
- Solve the remaining coverage as an exact memoized set cover over BigInt
  minterm masks (at most 64 cells, including six-variable maps).
- Select the currently most-constrained uncovered minterm to bound branching.
- Optimize in priority order: (1) fewest implicants, (2) fewest total literals,
  (3) deterministic numeric prime-index order.
- Do not modify the source on the old testing-only branch, production hosts,
  WordPress websites, or any trading component.

## VGM-Edge verification

- Before change: existing `node --test tests/minimal-cover.test.cjs` failed
  **2/4** groups, including five-vs-four counterexample and oracle mismatch.
- After source change: **4/4** existing test groups pass in 6.05 seconds.
- After additional 6-variable test group + deterministic tie-break:
  `node --test tests/minimal-cover.test.cjs` **5/5 groups pass** in 5.84 seconds.
  Assertions encompass exhaustive 2/3-variable truth tables, 250 4-variable
  independent cover-oracle trials, and several hundred 4/5/6-variable
  equivalence/repeatability checks.
- Separate ephemeral 6-variable benchmark (all synthetic, local Node VM of
  actual `solver.html`): 99 patterns, **12,672 SOP/POS point checks PASS**,
  mean processing 36.7 ms/case, slowest 625 ms (single VGM-Edge run; indicative
  only). Node max heap capped at 384 MB. This is not a guaranteed worst-case
  bound for every six-variable function.
- `git diff --check` PASS; no browser acceptance performed.

**Decision:** KEEP / RETEST visual-browser acceptance and GitHub CI before
merge. Commit and draft PR are only source-review candidates; no deployment.

**NEXT_ACTION:** verify PR CI; exercise UI 2–6 variable SOP/POS switching in a
supported real browser; review performance on adversarial dense patterns.
