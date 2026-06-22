---
phase: 3
title: "Tests docs and release"
status: completed
priority: P2
dependencies: [2]
effort: 2h
---

# Phase 3: Tests docs and release

## Context Links

- Current CLI command test: [packages/cli/test/program.test.ts](/Volumes/GOON/www/oss/decor-cli/packages/cli/test/program.test.ts:4)
- Root verification scripts: [package.json](/Volumes/GOON/www/oss/decor-cli/package.json:18)
- CI gate: [.github/workflows/ci.yml](/Volumes/GOON/www/oss/decor-cli/.github/workflows/ci.yml:13)
- Release gate: [.github/workflows/release.yml](/Volumes/GOON/www/oss/decor-cli/.github/workflows/release.yml:11)

## Overview

Cover the new installer with repo-standard tests, document the user flow, and spell out the release/PR operational notes. Keep CI on the existing lint/test/build path; do not add Cloudflare credentials to GitHub Actions for this first slice.

## Requirements

- Functional: tests cover registration, successful install, idempotent rerun, `--force`, and checksum failure.
- Non-functional: test fixtures stay local; no CI dependency on real R2 objects or secrets.

## Architecture

Validation flow: vitest unit/integration tests -> existing root `npm test`/`npm run build` -> PR review notes -> semantic-release publish on `main`/`dev` with no extra Cloudflare step.

## Related Code Files

- Create: `packages/cli/test/install-default-backgrounds.test.ts`
- Modify: `packages/cli/test/program.test.ts`
- Modify: `README.md`
- Modify: `docs/cli.md`
- Modify: `docs/contributing.md`
- Modify: `docs/project-roadmap.md`
- Modify: `docs/project-changelog.md`

## Implementation Steps

1. Add a CLI integration test that serves a fixture manifest and image payloads from a local HTTP server or equivalent stub, installs into a temp dir, and verifies file count plus hash behavior.
2. Extend the command registration test so `install-backgrounds` is part of the supported surface [packages/cli/test/program.test.ts:4-8].
3. Update README quick start and CLI docs to show `npm install -g decor-cli`, `decor install-backgrounds`, then `decor render --background-folder ~/.decor-cli/backgrounds ...` [README.md:5-20, docs/cli.md:3-14].
4. Update roadmap/changelog docs and add PR notes: use a `feat:` commit so semantic-release produces a minor version; mention the one-time maintainer publish step and confirm no secrets were committed.

## Todo List

- [x] Add tests for success, skip, force, and checksum mismatch.
- [x] Update README + CLI docs with install and reuse examples.
- [x] Update roadmap/changelog/contributing docs per repo policy.
- [x] Add PR checklist item: rerun publish script after asset changes and review generated manifest diff.

## Success Criteria

- [x] `npm test` covers the installer without reaching the live network.
- [x] Docs explain both maintainer publish flow and end-user install flow.
- [x] Release notes are straightforward: this is a new CLI capability, so the PR should land as `feat:` and semantic-release should cut a minor version.

## Risk Assessment

- Medium: tests accidentally couple to public R2 availability. Mitigation: use local fixtures only.
- Low: docs drift from actual install path. Mitigation: assert the reported install dir in tests and mirror that exact string in docs.

## Security Considerations

- Never print bucket credentials, tokens, or `.env` contents in tests, docs, or PR notes.
- Keep Cloudflare auth out of CI until there is a justified need for automated asset publishing.

## Next Steps

Implementation is ready once the maintainer publish contract and CLI command flags are approved.
