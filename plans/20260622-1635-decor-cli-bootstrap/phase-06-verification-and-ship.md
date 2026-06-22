---
phase: 6
title: "Verification and ship"
status: completed
priority: P1
effort: 1d
dependencies: [5]
---

# Phase 06: Verification and ship

## Context links
- `plans/reports/researcher-20260622-media-rendering.md:75-100`
- `plans/reports/researcher-20260622-agentization-release.md:83-125`
- `plans/reports/agentize-decisions-decor-cli.md`

## Overview
Run the final test matrix, smoke every supported workflow, validate release routing, and apply the ship gate. This phase exists to prove the implementation matches the plan before any stable or prerelease publish happens.

## Key insights
- Real render verification matters more than unit coverage alone.
- `dev` and `main` need separate release checks because they intentionally publish differently.
- The easiest way to ship a broken bootstrap is to skip auth, temp-file, or cross-platform smoke tests.
- Hostile negative tests are as important as happy-path real renders for this tool because URL/base64, output paths, and HTTP MCP are user-controlled surfaces.

## Requirements
- Functional: run unit, integration, and CLI/MCP smoke tests with real `sharp` and `ffmpeg`.
- Functional: verify local path, URL, and base64 inputs; annotations, shapes, and spotlight; CLI commands; MCP stdio and HTTP flows.
- Functional: verify hostile URL/base64 fixtures, output overwrite/symlink/path traversal protections, cleanup-on-failure, concurrent render isolation, and HTTP auth/origin/body-limit behavior.
- Functional: run semantic-release dry-runs for both `dev` and `main` branch modes inside GitHub Actions before any real publish.
- Functional: check source artifacts for stale plan/finding labels in code comments, filenames, and tests.
- Functional: produce a short ship checklist artifact with pass/fail results and unresolved questions, if any.
- Non-functional: no mocked-only success claims; every critical workflow must have one real end-to-end verification.

## Architecture
Data flow:
1. CI and local verification scripts invoke the built packages.
2. Smoke tests generate real outputs and collect metadata.
3. Release dry-runs inspect semantic-release branch behavior without publishing and prove publish jobs are protected.
4. Final ship checklist compares observed behavior against the locked decisions and docs.

## Related code files
- Own: `scripts/**`, test files, release-dry-run helpers, final verification notes in `docs` if needed.
- Create: `scripts/smoke-render.mjs`, `scripts/smoke-cli.mjs`, `scripts/smoke-mcp.mjs`, `scripts/verify-release-dry-run.mjs`, `scripts/check-source-artifact-names.mjs`, optional ship checklist artifact under `docs/` or `plans/reports/`.
- Modify: `packages/*/test/**`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, docs only if verification exposes drift.
- Delete: none.

## Implementation steps
1. Add smoke scripts for image render, video render, CLI commands, and MCP transports using real fixtures.
2. Run or automate URL, base64, annotation, shape, and spotlight end-to-end checks.
3. Run hostile URL/base64, temp cleanup, output safety, concurrent render, and HTTP auth/origin/body-limit tests.
4. Add release dry-run verification for `dev` beta plus GitHub prerelease and `main` stable latest inside GitHub Actions.
5. Run source artifact naming/comment checks for stale plan labels or finding IDs.
6. Reconcile any docs or workflow drift discovered during verification.
7. Produce the ship checklist with exact pass/fail evidence and block publish if any P1 gate fails.

## Todo list
- [ ] Real render smoke scripts exist.
- [ ] CLI and MCP smoke coverage matches the locked v1 surface.
- [ ] Hostile input, output safety, cleanup, and HTTP boundary tests pass.
- [ ] Release dry-runs validate both branch lanes.
- [ ] Source artifact label check passes.
- [ ] Docs and release config are corrected if verification finds drift.
- [ ] Ship checklist is written with concrete evidence.

## Success criteria
- [ ] Real smoke tests pass for image and video rendering on the supported matrix.
- [ ] CLI supports path, URL, and base64 inputs end-to-end.
- [ ] MCP `stdio` and HTTP flows both pass auth and execution checks; SSE remains optional compatibility coverage only.
- [ ] semantic-release dry-runs in GitHub Actions prove `dev` -> `beta` + GitHub prerelease and `main` -> stable `latest`.
- [ ] Release publish jobs are protected and unavailable to PR workflows.
- [ ] No P1 blocker remains open at ship time.

## Risk assessment
- High x High: cross-platform binary issues appear only at final verification. Mitigation: keep OS matrix in CI and run real fixture smoke tests.
- Medium x High: release dry-run passes locally but workflow env differs. Mitigation: verify in GitHub Actions with branch-specific dry-run jobs and protected publish gates.
- Medium x Medium: docs lag behind actual command/tool behavior. Mitigation: fail the ship checklist when docs mismatch user-visible behavior.

## Security considerations
- Run HTTP auth and origin tests as part of the smoke matrix.
- Verify temp files are cleaned and outputs respect explicit destination paths only.
- Ensure release dry-runs do not leak tokens or provenance settings in logs.

## Rollback
- Stop at no-publish when any ship gate fails.
- Revert verification-only scripts or workflow tweaks independently from product code if they prove noisy.

## Next steps
After this phase passes, the repo is ready for actual prerelease publishing on `dev` and stable publishing on `main`.
