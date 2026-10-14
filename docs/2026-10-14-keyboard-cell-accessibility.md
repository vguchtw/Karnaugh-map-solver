# Karnaugh cell keyboard accessibility — 2026-10-14

## User-facing defect
The standalone Karnaugh map previously created bare clickable table cells. They could not be reached using Tab and did not expose their current 0/1 value to assistive technologies. Users without a pointing device could not edit the truth table.

## Bounded correction
- Each generated map cell is keyboard focusable (`tabIndex = 0`) and identified as a checkbox with its canonical binary minterm index in `aria-label`.
- The `aria-checked` state is updated alongside the existing visual value and active class.
- Space and Enter invoke the same toggle handler as a mouse click; Space prevents page scrolling. Unrelated keys are ignored.
- Visible `:focus-visible` outline and keyboard instructions are provided.
- The accessibility setup is regenerated with the map when switching 2–6 variables.
- Boolean minimization, SOP/POS, logic diagrams, pseudocode and production deployment are unchanged.

## Actual evidence (VGM-Edge, Node 22.23.3)
- Isolated worktree based on exact draft PR #6 head `4cc74ab9c2cfb29f8d403db51d29fbe1db7edb65`.
- Test-first baseline: **0/5** new synthetic-DOM regression groups passed against unchanged source. Failures reproduced missing keyboard focus/semantics/activation and focus indicator.
- After correction: **10/10** total Node test groups passed in **6.11 seconds**: five new keyboard/ARIA/UI groups plus five original exact-cover correctness groups. `git diff --check` passed.
- The DOM tests execute the actual embedded browser JavaScript under Node VM with a purpose-built fake DOM. They verify state, event handlers and regenerated 6-variable map but **do not constitute real-browser or screen-reader acceptance**.
- No real people, data, network, OSINT, APP-Ink, trading code, WordPress, production services or hardware modified.

## Decision
**KEEP as draft candidate.** Require independent review, CI, and real-browser keyboard/screen-reader smoke test before merge/deploy. Parent PR #6 exact-cover solver remains a separate unmerged dependency.
