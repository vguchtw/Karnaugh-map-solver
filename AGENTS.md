# VGM coding-agent instructions

## Shared VGM Edge / Git / Qwen capabilities (portfolio rule, 2026-11-10)
Canonical full runbook: https://github.com/vguchtw/project-orchestrator/blob/main/docs/vgm-shared-engineering-capabilities.md

At each suitable task, check actual VGM Edge/VGM Server/optional Desktop connectivity, GitHub source SHA, runner/queue status and authorized lease before choosing tools. GitHub stays canonical for source/PRs/issues. Use existing qualified VGM Edge local Git CI with isolated, pinned-SHA worktrees and real recorded test commands/results/artifacts instead of repeatedly blocking on historical GitHub Actions billing. Distinguish LOCAL_PASS from GITHUB_PASS and any unsatisfied required GitHub checks; never fabricate a passing status or bypass branch protection.

For AWS-based applications, use VGM Edge Floci (~/vgm-floci, Docker vgm-floci, aws-local helper and smoke-test.sh) for supported AWS-compatible local development. Do not assume API parity; final security/integration acceptance must be verified on authorized real AWS. This is not authorization to spend money or deploy.

For Qwen-suitable coding/testing/debugging work, consult the GitHub-linked VGM Server delivery queue ~/vgm-delivery-engine/queue/tasks.json and queue/state.json. A distinct bounded ~/vgm-qwen-worker supervisor exists: verify wiring/ownership rather than assuming automatic dispatch. Check the model endpoint is online (VGM Desktop GPU is optional/offline sometimes), specify small acceptance-tested tasks, independently inspect changes and rerun tests before integration. Avoid expensive Claude routine subreviews. Keep existing special project authorization, production/privilege restrictions, source custody, lease ownership and PAPER/LIVE trading safety intact. Record actual host, SHA, tests, local/GitHub statuses and installed/deployed acceptance stage.
