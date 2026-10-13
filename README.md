# Karnaugh-map-solver
Karnaugh map solver in HTML and Javascript


## Exact Boolean minimization

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
