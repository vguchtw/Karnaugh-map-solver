# Karnaugh-map-solver
Karnaugh map solver in HTML and Javascript


## Exact Boolean minimization

The standalone map's cells are keyboard accessible: use Tab to focus a minterm and Space or Enter to toggle it. Each cell exposes its minterm number and on/off state to assistive technologies; keyboard focus has a visible outline. See [keyboard regression evidence](docs/2026-10-14-keyboard-cell-accessibility.md).

Use the **Clear map** button to reset all selected minterms without changing the variable count, SOP/POS form, or output mode. The button is keyboard accessible and works offline.

Gray-code row and column headers show the binary coordinates of each minterm. The upper-left header names the row and column variable groups (for example, `AB / CD` for four variables); only data cells toggle. The header order follows Gray code, not ordinary binary order.

The solver also works on narrow phone screens: tap minterms, change the 2–6 variable settings, and swipe sideways **inside the map** when the 8-column layout is wider than the viewport. The entire page does not scroll horizontally. See the [responsive mobile regression evidence](docs/2026-10-14-responsive-mobile-solver.md). A local real-Chrome check is available when Chrome and Puppeteer are already installed:

```bash
CHROME_PATH=/path/to/chrome PUPPETEER_MODULE=/path/to/puppeteer node tests/mobile-browser.acceptance.cjs
```

This optional browser test uses disposable Chrome profiles, local `solver.html`, and does not install packages.

The standalone `solver.html` supports 2–6 variables and both sum-of-products
(SOP) and product-of-sums (POS). After Quine–McCluskey prime generation, its
cover selector picks a **globally minimal number of implicants**, breaking ties
by the fewest total literals. It uses mandatory essential primes and an exact,
memoized bitmask search rather than greedy widest-prime selection. The masks
use `BigInt` to represent up to 64 cells; term ties use numeric index order,
not locale-dependent string comparisons.

Run its dependency-free, actual-solver regression suite with Node 22+:

```bash
node --test tests/*.test.cjs
```

The suite includes exhaustive 2–3-variable equivalence, sampled 4–6-variable
SOP/POS equivalence, deterministic 6-variable stress and independent
four-variable exact-cover oracle comparisons. These verify Boolean results,
not physical/electrical design safety or live browser compatibility.
