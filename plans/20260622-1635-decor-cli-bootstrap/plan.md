---
title: "decor-cli bootstrap and agentization"
description: "Bootstrap a TypeScript monorepo with real media rendering, CLI, MCP, docs, and semantic-release lanes."
status: completed
priority: P2
effort: 8d
branch: feature/bootstrap-decor-cli
tags: [typescript, cli, mcp, rendering, semantic-release]
created: 2026-06-22
blockedBy: []
blocks: []
---

# decor-cli bootstrap and agentization

## Goal
Bootstrap a greenfield monorepo with `packages/core`, `packages/cli`, `packages/mcp`, `claude/skills/decor-cli`, repo docs, and release automation. V1 scope is locked to real `sharp` image rendering, real `ffmpeg` video frame rendering, local/URL/base64 inputs, built-in templates plus default config, annotations/shapes/spotlight, MCP, and semantic-release on `main` and `dev`. Evidence: `plans/reports/researcher-20260622-media-rendering.md:5-30`, `plans/reports/researcher-20260622-media-rendering.md:93-100`, `plans/reports/researcher-20260622-agentization-release.md:10-14`, `plans/reports/researcher-20260622-agentization-release.md:21-109`.

## Locked decisions
- Workspace: one TypeScript monorepo with shared core and thin CLI/MCP adapters; repo-local skill lives at `claude/skills/decor-cli`.
- Rendering: `sharp` for image jobs, system `ffmpeg` plus `ffprobe` for video jobs, one shared scene/config model. `DECOR_FFMPEG_PATH` and `DECOR_FFPROBE_PATH` may override discovery; no GPL static binary is bundled in v1.
- Inputs: local file path, remote URL, and base64 source are first-class in v1.
- Release: `main` publishes stable `latest`; `dev` publishes npm `beta` and a GitHub prerelease.
- Auth: no `login` command in v1; credentials/config resolve from flags, env, and config files only.
- MCP: `stdio` default, Streamable HTTP is a hard v1 gate, SSE compatibility-only and never the preferred transport.
- Decision record: `plans/reports/agentize-decisions-decor-cli.md`.

## Security gates
- URL inputs: `http`/`https` only; redirects are revalidated; private, loopback, link-local, multicast, and metadata IP ranges are denied by default; DNS results are checked before connect; download timeout, redirect count, content-length precheck, streaming byte cap, MIME/media sniffing, max dimensions, and max duration are enforced.
- Base64 inputs: decoded byte size is capped before allocation where possible; malformed and oversize payloads fail before probing.
- Temp/output files: each render uses per-job `mkdtemp`, random names, `finally` cleanup, best-effort signal cleanup, atomic output writes, explicit overwrite opt-in, and symlink/path traversal guards.
- MCP HTTP: binds `127.0.0.1` by default; non-local bind requires explicit `--host`; bearer token must come from env/flag and is required before request parsing or tool execution; allowed origins are explicit; absent `Origin` is accepted only for bearer-authenticated non-browser clients; body size limits are enforced.
- Release: CI/test/dry-run jobs are separate from publish jobs; publish runs only on protected `main`/`dev` pushes or protected release environments, with minimal permissions and trusted publishing/provenance where available. PR workflows never receive publish secrets.

## Dependency graph
1. Phase 01 creates the workspace, package boundaries, test fixtures, and shared contract stubs; all later phases depend on it.
2. Phase 02 builds the transport-neutral render core; phases 03 and 04 depend on its contracts and output shape.
3. Phase 03 adds CLI commands, template resolution, and default config over the core.
4. Phase 04 adds MCP transports and the companion skill using the finalized core plus CLI-facing naming.
5. Phase 05 adds CI, semantic-release, packaging, and required project docs after command/tool contracts stop moving.
6. Phase 06 runs matrix verification, release dry-runs, and ship gates after all earlier phases are complete.
7. Phases stay sequential by design; root workspace files, core contracts, and docs/release files overlap too much for safe parallel edits.

## Compatibility and migration
- There is no existing runtime or user data to migrate, but config and template schemas should include a version field from v1 so later migrations are explicit.
- CLI command names and MCP tool names become stable contracts after phases 03 and 04; prerelease changes stay on `dev` until phase 06 signs off.
- Video support depends on discoverable system `ffmpeg`/`ffprobe` or explicit env overrides; `doctor` reports missing binaries with install guidance.

## Phase map
| Phase | File | Primary ownership | Done when |
|---|---|---|---|
| 1 | [Plan and scaffold](./phase-01-plan-and-scaffold.md) | root workspace, package manifests, TS base, fixture skeleton | Completed |
| 2 | [Core renderer](./phase-02-core-renderer.md) | `packages/core/**` | Completed |
| 3 | [CLI and templates](./phase-03-cli-and-templates.md) | `packages/cli/**`, template/config UX | Completed |
| 4 | [MCP and skill](./phase-04-mcp-and-skill.md) | `packages/mcp/**`, `claude/skills/decor-cli/**` | Completed |
| 5 | [CI release and docs](./phase-05-ci-release-and-docs.md) | `.github/**`, release config, `README.md`, `docs/**` | Completed |
| 6 | [Verification and ship](./phase-06-verification-and-ship.md) | smoke scripts, final test gates, ship checklist | Completed |

## Test matrix
- Unit: geometry math, schema validation, config merge rules, template resolution, auth/config resolution, error mapping.
- Integration: real `sharp` image renders, real `ffmpeg` video renders, CLI command execution, MCP tool round-trips, HTTP auth/origin checks.
- End-to-end: render from local path, URL, and base64; verify annotations/shapes/spotlight; run semantic-release dry-runs on `dev` and `main`.
- Platforms: Linux, macOS, Windows; Node pinned to 20+ in engines and CI.

## Top risks
- Medium x High: missing system `ffmpeg` breaks video rendering. Mitigation: env overrides, `doctor` diagnostics, CI installs ffmpeg per OS, and video commands fail with actionable errors.
- Medium x High: large URL/base64 inputs can spike memory or leak temp files. Mitigation: deny risky networks, stream to temp files, cap payload size, enforce probe limits, and always clean temp paths.
- Medium x High: HTTP MCP auth or `Origin` mistakes expose remote tools. Mitigation: token-required auth-before-parse, localhost defaults, explicit non-local opt-in, body limits, and auth/origin tests.
- Medium x Medium: font metrics drift across OSes. Mitigation: ship test fonts and golden fixtures; probe output pixels instead of trusting text metrics.
- Low x High: semantic-release branch drift can misroute prereleases. Mitigation: branch config in source control plus dry-run gates in phase 06.

## Rollback
- Phase 01 rollback is structural: revert workspace and manifest scaffolding only.
- Phase 02 rollback is isolated to `packages/core`; adapters remain blocked rather than partially broken.
- Phase 03 and 04 rollback independently because they are thin adapters over core.
- Phase 05 rollback is `ci.yml`, release workflow, and docs only; local dev flow remains usable.
- Phase 06 never publishes when CI, protected publish gates, or branch dry-runs fail; rollback is no-ship plus revert of unreleased release/config changes.
