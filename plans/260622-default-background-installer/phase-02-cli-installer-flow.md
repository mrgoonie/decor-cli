---
phase: 2
title: "CLI installer flow"
status: completed
priority: P2
dependencies: [1]
effort: 2h
---

# Phase 2: CLI installer flow

## Context Links

- Render command background flags: [packages/cli/src/commands/render-command.ts](/Volumes/GOON/www/oss/decor-cli/packages/cli/src/commands/render-command.ts:15)
- CLI request mapping: [packages/cli/src/options/build-render-request.ts](/Volumes/GOON/www/oss/decor-cli/packages/cli/src/options/build-render-request.ts:57)
- Core folder background behavior: [packages/core/src/render/background.ts](/Volumes/GOON/www/oss/decor-cli/packages/core/src/render/background.ts:14)
- Existing utility command surface: [packages/cli/src/commands/utility-commands.ts](/Volumes/GOON/www/oss/decor-cli/packages/cli/src/commands/utility-commands.ts:6)

## Overview

Add `decor install-backgrounds` so a fresh machine can populate a local default folder after `npm install -g decor-cli`. Keep the contract small: default install path `~/.decor-cli/backgrounds`, `--dir` override, `--force` for redownload, and checksum-verified writes.

## Requirements

- Functional: install the manifest-listed assets into the target directory and report `{ installDir, installed, updated, skipped }`.
- Non-functional: idempotent reruns, atomic file replacement, cross-platform path resolution, no arbitrary remote URL input in v1.

## Architecture

Data flow: CLI command -> committed manifest -> downloader/verifier -> temp file write -> atomic rename into install dir -> existing `--background-folder` render flow.

## Related Code Files

- Create: `packages/cli/src/backgrounds/install-default-backgrounds.ts`
- Create: `packages/cli/src/backgrounds/resolve-default-background-dir.ts`
- Modify: `packages/cli/src/commands/utility-commands.ts`
- Modify: `packages/cli/test/program.test.ts`

## Implementation Steps

1. Add a small helper that resolves `~/.decor-cli/backgrounds` via `os.homedir()` and creates the directory recursively.
2. Implement installer logic that iterates the manifest, downloads each asset, verifies `sha256` and `bytes`, then writes through a temp file + rename flow so interrupted installs do not leave half-written files.
3. Skip files whose existing bytes/hash already match; use `--force` to redownload known-good files when the user wants a clean refresh.
4. Register `install-backgrounds` beside the other utility commands and reuse the existing JSON/text output formatter instead of inventing a new CLI response contract [packages/cli/src/formatters/output.ts:8-35].

## Todo List

- [x] Add install dir resolution helper.
- [x] Add manifest-driven downloader and verifier.
- [x] Register the command and expose `--dir` plus `--force`.
- [x] Print the resolved directory so docs can point users back into `decor render --background-folder`.

## Success Criteria

- [x] `decor install-backgrounds` installs all manifest assets into the default user folder.
- [x] A second run skips unchanged files; `--force` redownloads them.
- [x] Core render behavior stays unchanged because the command only prepares a folder for existing background selection logic.

## Risk Assessment

- Medium: user home path differences across OSes. Mitigation: centralize path resolution in one helper and cover it in tests.
- Medium: corrupt or truncated download. Mitigation: verify size and checksum before rename; fail the run if any asset does not match.

## Security Considerations

- Do not accept arbitrary manifest URLs in the public command in v1.
- Download only HTTPS URLs baked into the committed manifest.

## Next Steps

Phase 3 adds tests, doc updates, and PR/release notes around the new command.
