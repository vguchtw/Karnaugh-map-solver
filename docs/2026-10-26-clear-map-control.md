# 2026-10-26 — Clear map control

Project: `vguchtw/Karnaugh-map-solver`, non-trading standalone demo.
Parent: PR #9 at `72da197e18adc063558a88443d8b690ac834eb22`.
Branch: `fix/kmap-clear-control-20261026`.

## Motivation and bounded change
Without a clear action, users must individually toggle up to 64 selected cells to start a new truth table. Add one native keyboard-accessible button to clear all minterms while retaining the current 2–6-variable dimension, SOP/POS form and output mode. Reuse the existing map-generation and solve paths; no changes to minimization or deployment.

## Test-first evidence
Two added tests failed on unchanged PR #9 (missing native button and ineffective reset). The seven existing keyboard tests passed. After the change, the focused nine-test suite passed; the full dependency-free suite passed 17/17 on VGM-Edge (Node 22.23.4). The optional real-browser keyboard acceptance was updated to reflect the additional Tab stop and verify Enter-to-clear.

## Release
KEEP DRAFT / RETEST pending independent cross-host browser acceptance, hosted CI, and review of parent PR chain #6–#9. No APP-Ink, Project Orchestrator, production or trading changes.

## NEXT_ACTION
Independently run real-browser and Windows tests on exact published SHA; inspect hosted CI; request accessibility review before integration.
