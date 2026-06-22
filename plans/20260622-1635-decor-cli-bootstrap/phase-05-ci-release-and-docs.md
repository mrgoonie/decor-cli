---
phase: 5
title: "CI release and docs"
status: completed
priority: P2
effort: 1d
dependencies: [3, 4]
---

# Phase 05: CI release and docs

## Context links
- `plans/reports/researcher-20260622-media-rendering.md:68-91`
- `plans/reports/researcher-20260622-agentization-release.md:83-109`
- `plans/reports/agentize-decisions-decor-cli.md`

## Overview
Add CI, semantic-release, packaging metadata, and the required docs set after the command and tool contracts settle. This phase turns the bootstrap repo into a publishable project without widening product scope.

## Key insights
- Release automation is part of the architecture, not an afterthought, because `main` and `dev` have different publish behavior.
- Docs must describe the real shipped command and tool surfaces, not intent.
- Video binary policy is closed before implementation: no bundled static ffmpeg; docs and CI install/use system `ffmpeg` and `ffprobe`.

## Requirements
- Functional: create CI for install, typecheck, lint, unit/integration tests, and build across Linux, macOS, and Windows.
- Functional: configure semantic-release so `main` publishes stable `latest` and `dev` publishes npm `beta` plus GitHub prereleases.
- Functional: split CI/dry-run jobs from publish jobs; publish runs only on protected `main`/`dev` pushes or protected release environments, with minimal workflow permissions and trusted publishing/provenance where available.
- Functional: publish package metadata for the CLI and shared packages; document how MCP is run locally and remotely.
- Functional: populate `README.md` and required repo docs under `docs/`, including roadmap and changelog updates.
- Non-functional: release automation must support dry-run validation before real publish; PR workflows never receive publish secrets; no secret values in workflow logs or docs.

## Architecture
Data flow:
1. Push or PR triggers CI.
2. CI installs dependencies, runs typecheck, tests, and build jobs.
3. Pushes to `main` or `dev` run semantic-release dry-run checks before publish.
4. Protected publish jobs run semantic-release with branch-specific behavior, publish npm packages, and create GitHub release artifacts or prereleases.
5. Docs are updated from the finalized command/tool contracts and release policy.

## Related code files
- Own: `.github/workflows/**`, release config, `README.md`, `docs/**`, root `package.json` publish metadata.
- Create: `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `release.config.cjs`, `docs/cli.md`, `docs/mcp.md`, `docs/contributing.md`, plus required repo docs if phase 01 created only placeholders.
- Modify: `package.json`, `packages/*/package.json`, `README.md`, `docs/project-overview-pdr.md`, `docs/code-standards.md`, `docs/codebase-summary.md`, `docs/system-architecture.md`, `docs/development-roadmap.md`, `docs/project-changelog.md`.
- Delete: none.

## Implementation steps
1. Add CI workflow with workspace install, typecheck, lint, unit tests, integration tests, and build jobs on Linux, macOS, and Windows.
2. Add semantic-release config for `main` stable and `dev` beta plus GitHub prerelease behavior.
3. Add workflow permissions, environment/protected-branch assumptions, trusted publishing/provenance config, and PR-secret isolation.
4. Document system `ffmpeg`/`ffprobe` installation and env overrides for users and CI.
5. Add package metadata such as `bin`, `exports`, `files`, `engines`, and provenance-friendly publish settings.
6. Replace doc placeholders with actual architecture, CLI, MCP, contributing, roadmap, and changelog content based on the implementation.
7. Add release and local-dev instructions that match the real workflows, including prerelease behavior on `dev`.

## Todo list
- [ ] CI covers three operating systems.
- [ ] semantic-release is configured for `main` and `dev`.
- [ ] Publish jobs are separated from PR/dry-run jobs and have minimal permissions.
- [ ] Package metadata is publish-safe.
- [ ] Required project docs are populated, not placeholder-only.
- [ ] System `ffmpeg`/`ffprobe` requirement and env overrides are documented.

## Success criteria
- [ ] CI runs install, build, and real render tests across the target OS matrix.
- [ ] semantic-release dry-run shows `main` and `dev` routing to the correct release lanes.
- [ ] Real publish job is protected from PR secrets and requires protected branches or protected environments.
- [ ] README and docs explain install, config, rendering workflows, MCP usage, and release policy accurately.
- [ ] Roadmap and changelog reflect the bootstrap milestones and release behavior.

## Risk assessment
- High x Medium: release config drift routes prereleases incorrectly. Mitigation: commit branch config and test dry-runs in phase 06.
- Medium x Medium: docs diverge from code. Mitigation: write docs only after commands and tools are frozen.
- Medium x Medium: users lack system `ffmpeg`. Mitigation: `doctor`, clear install docs, env overrides, and CI coverage.

## Security considerations
- Use GitHub secrets or trusted publishing only; never print tokens in logs.
- Keep workflow permissions minimal and explicit.
- Do not expose npm or GitHub publish secrets to PR workflows.
- Ensure docs describe secret names and setup flow only, never actual values.

## Rollback
- Disable or revert release workflows independently of runtime code.
- Revert docs and release metadata without touching core render behavior.

## Next steps
Phase 06 executes the final verification matrix and ship checklist against the exact CI and release setup defined here.
