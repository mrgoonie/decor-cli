---
title: "decor-cli default background installer"
description: "Add a maintainer R2 publish flow and a user CLI command that installs default backgrounds into a local cache directory."
status: completed
priority: P2
effort: 6h
branch: feature/default-background-installer
tags: [cli, assets, r2, docs]
created: 2026-06-22
blockedBy: []
blocks: []
createdBy: "ck:plan"
source: skill
---

# decor-cli default background installer

## Goal

Add a repeatable path for shipping the repo's example backgrounds as installable defaults. Today the CLI already accepts `--background-folder` and passes folder-backed image backgrounds into core rendering [packages/cli/src/commands/render-command.ts:15-17, packages/cli/src/options/build-render-request.ts:57-59], while core already picks a random image from a folder [packages/core/src/render/background.ts:14-20, packages/core/src/render/background.ts:40-64]. The missing pieces are asset hosting, a versioned manifest, and a local installer command.

## Locked approach

- Keep rendering core unchanged; this is a CLI + maintainer-ops feature layered over existing folder support [packages/core/src/render/background.ts:14-20].
- Publish the source assets from `examples/backgrounds/*` to Cloudflare R2 bucket `zuey`, then commit a generated TypeScript manifest with `url`, `sha256`, and `bytes`. This fits the current `tsc`-only build and npm package file list without adding raw asset copy steps [tsconfig.base.json:10, packages/cli/package.json:17-29].
- Add `decor install-backgrounds` under the existing utility command surface, defaulting to `~/.decor-cli/backgrounds`, with `--dir` override and checksum verification. Utility commands currently expose `list-templates`, `doctor`, `validate`, and `config` only [packages/cli/src/commands/utility-commands.ts:6-38].
- Keep R2 upload out of automated release for v1. Current CI and release jobs do not have Cloudflare steps, only lint/test/build/release [package.json:18-29, .github/workflows/ci.yml:13-40, .github/workflows/release.yml:11-62].

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Asset manifest and hosting](./phase-01-asset-manifest-and-hosting.md) | Complete |
| 2 | [CLI installer flow](./phase-02-cli-installer-flow.md) | Complete |
| 3 | [Tests docs and release](./phase-03-tests-docs-and-release.md) | Complete |

## Dependencies

- Phase 1 blocks Phase 2 because the installer should consume a committed manifest, not discover assets dynamically.
- Phase 2 blocks Phase 3 because tests and docs need the final command contract and output shape.
- Existing bootstrap plan is completed, so there is no cross-plan blocker [plans/20260622-1635-decor-cli-bootstrap/plan.md:1-77].

## Compatibility

- Existing `decor render --background-folder ...` usage stays valid [README.md:15-20].
- New installs write to a user cache directory by default; no existing repo files or config schema need migration.
- The package remains publishable with current `files` rules because only compiled JS/TS output ships, not raw example images [packages/cli/package.json:17-22].

## Test Matrix

- Unit: manifest schema validation, install path resolution, checksum/size verification, idempotent skip logic.
- Integration: local HTTP fixture manifest plus assets, install into temp dir, rerun with `--force` and corrupted file cases.
- CLI contract: command registration and JSON/text output shape.

## Top Risks

- High: wrong public base URL yields a valid build with broken installs. Mitigation: require an explicit public base URL during manifest publish and verify each uploaded object before writing the manifest.
- Medium: partial downloads leave corrupt files in `~/.decor-cli/backgrounds`. Mitigation: download to temp files, verify checksum, then rename atomically.
- Medium: automating R2 upload inside release would add new secret blast radius. Mitigation: keep upload as an explicit maintainer script for now.

## Rollback

- Phase 1 rollback: revert the generated manifest and publish script; existing render paths still work with user-supplied folders.
- Phase 2 rollback: remove the new CLI command and helper modules; no core or MCP contract changes to unwind.
- Phase 3 rollback: revert tests/docs only; CI and semantic-release lanes remain on their current path.
