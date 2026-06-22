---
phase: 1
title: "Plan and scaffold"
status: completed
priority: P1
effort: 0.5d
dependencies: []
---

# Phase 01: Plan and scaffold

## Context links
- `plans/reports/researcher-20260622-media-rendering.md:17-30`
- `plans/reports/researcher-20260622-media-rendering.md:32-48`
- `plans/reports/researcher-20260622-agentization-release.md:21-47`
- `plans/reports/agentize-decisions-decor-cli.md`

## Overview
Create the monorepo skeleton, root toolchain, package boundaries, fixture layout, and shared contract stubs so later phases do not invent structure. This phase is done only when the repo installs cleanly and every package can typecheck against placeholder exports.

## Key insights
- The repo is effectively greenfield, so structure must be locked before any renderer or transport code lands.
- One shared scene/config model is the anti-drift boundary between image, video, CLI, and MCP work.
- Thin adapters are required; `packages/core` cannot import CLI or MCP concerns.

## Requirements
- Functional: scaffold root `package.json`, npm workspaces, `tsconfig.base.json`, root scripts, `packages/core`, `packages/cli`, `packages/mcp`, `claude/skills/decor-cli`, `docs`, `scripts`, and fixture directories.
- Functional: define transport-neutral stubs for `render-request`, `scene-spec`, `template-definition`, `render-result`, and error codes.
- Functional: add placeholder docs files required by repo rules so later phases update real targets instead of inventing locations.
- Functional: close the video binary decision before dependency install: v1 uses system `ffmpeg`/`ffprobe` discovery plus `DECOR_FFMPEG_PATH` and `DECOR_FFPROBE_PATH` overrides; no `ffmpeg-static` dependency is bundled.
- Non-functional: Node version is pinned to Node 20+ for package compatibility; scripts must be cross-platform; no committed secrets; no generated file should assume a shell-only path convention.

## Architecture
Data flow:
1. Root workspace scripts orchestrate install, build, test, and release tasks.
2. `packages/core` exports contracts, schemas, and future render entry points.
3. `packages/cli` and `packages/mcp` depend on compiled core only.
4. `claude/skills/decor-cli` and docs consume the same command and tool names once phases 03 and 04 finalize them.

## Related code files
- Own: `package.json`, `tsconfig.base.json`, `.gitignore`, `README.md`, `packages/core/**`, `packages/cli/**`, `packages/mcp/**`, `claude/skills/decor-cli/**`, `docs/**`, `scripts/**`.
- Create: `package.json`, `tsconfig.base.json`, `packages/core/src/index.ts`, `packages/core/src/contracts/*.ts`, `packages/cli/src/index.ts`, `packages/mcp/src/index.ts`, `claude/skills/decor-cli/SKILL.md`, `docs/project-overview-pdr.md`, `docs/code-standards.md`, `docs/codebase-summary.md`, `docs/system-architecture.md`, `docs/development-roadmap.md`, `docs/project-changelog.md`.
- Modify: none.
- Delete: none.

## Implementation steps
1. Initialize npm workspaces and root scripts for `build`, `typecheck`, `lint`, `test`, and `release:dry-run`.
2. Add root TypeScript config and per-package `package.json` plus `tsconfig.json` files.
3. Create `packages/core` contract stubs and export surface with zero CLI/MCP imports.
4. Create empty adapter entry points in `packages/cli` and `packages/mcp` that compile against core placeholders.
5. Create fixture directories for image, video, template, and golden-output assets plus temp-output ignore rules.
6. Add binary resolver contracts for system `ffmpeg`/`ffprobe` without bundling static binaries.
7. Create repo doc placeholders and the skill stub so later phases modify stable files instead of inventing new paths.
8. Verify a clean install and typecheck from the workspace root.

## Todo list
- [ ] Root workspace and package manifests exist.
- [ ] TypeScript base config and per-package configs compile.
- [ ] Core contract stubs export stable names.
- [ ] System `ffmpeg`/`ffprobe` resolver contract exists; no static ffmpeg package is installed.
- [ ] Fixture and temp directories are present and ignored correctly.
- [ ] Required docs placeholders exist.
- [ ] `claude/skills/decor-cli/SKILL.md` exists as a stub only.

## Success criteria
- [ ] `npm install` completes from the repo root without manual steps.
- [ ] `npm run typecheck` passes with scaffold-only code.
- [ ] Every package imports `packages/core` through declared exports instead of relative cross-package paths.
- [ ] No secrets or temp outputs are tracked accidentally; tiny deterministic media fixtures are either generated in tests or intentionally tracked under fixture paths.

## Risk assessment
- High x Medium: package layout drift if adapters start before core contracts exist. Mitigation: block phases 03 and 04 on this phase.
- Medium x Medium: wrong Node baseline breaks package installs later. Mitigation: lock `engines.node` to Node 20+ now and reuse it in CI.
- Low x High: docs path drift versus repo rules. Mitigation: create required docs files in this phase.

## Security considerations
- Keep scaffold config secret-free; only example env names, never values.
- Add ignore rules for temp files and rendered outputs used during local verification.
- Do not enable HTTP listeners or token handling in this phase.
- Do not add `ffmpeg-static`; document the system-binary resolver and env override names instead.

## Rollback
- Revert root manifests, workspace config, and empty package folders together.
- Keep decision records and plan docs; only code scaffold rolls back.

## Next steps
Phase 02 can start after root install and typecheck are green.
