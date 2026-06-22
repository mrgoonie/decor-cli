---
phase: 1
title: "Asset manifest and hosting"
status: completed
priority: P2
dependencies: []
effort: 2h
---

# Phase 1: Asset manifest and hosting

## Context Links

- CLI package publish constraints: [packages/cli/package.json](/Volumes/GOON/www/oss/decor-cli/packages/cli/package.json:17)
- TS build behavior: [tsconfig.base.json](/Volumes/GOON/www/oss/decor-cli/tsconfig.base.json:10)
- Source asset folder reference: [README.md](/Volumes/GOON/www/oss/decor-cli/README.md:15)

## Overview

Create a maintainer-only flow that uploads the repo's example background assets to R2 bucket `zuey` and regenerates a committed manifest that the CLI can import at build time. Keep this flow explicit and local so the repo does not gain Cloudflare release secrets.

## Requirements

- Functional: upload every file from `examples/backgrounds/`, compute `sha256` and `bytes`, and emit stable public URLs.
- Non-functional: idempotent reruns, deterministic object keys, no secret printing, no `.env` reads in committed code.

## Architecture

Data flow: `examples/backgrounds/*` -> publish script -> R2 objects in `zuey` -> generated `default-background-manifest.ts` -> committed CLI runtime input.

## Related Code Files

- Create: `scripts/publish-default-backgrounds.ts`
- Create: `packages/cli/src/backgrounds/default-background-manifest.ts`
- Modify: `package.json`
- Modify: `docs/contributing.md`

## Implementation Steps

1. Add a root script that walks `examples/backgrounds/*`, sorts by filename, computes `sha256` plus byte length, and uploads each file to a stable object key such as `decor-cli/default-backgrounds/<filename>`.
2. Require the script caller to pass the public base URL explicitly and default only the bucket name to `zuey`; fail fast if any upload or post-upload verification fails.
3. Generate a TypeScript manifest module, not JSON, so the CLI can import it without adding a dist asset copy step under the current `tsc` build [tsconfig.base.json:10, packages/cli/package.json:17-29].
4. Add a root npm script alias so maintainers can rerun publish/regenerate before PR or release when the default asset set changes.

## Todo List

- [x] Define manifest schema with `version` and `assets[]` entries.
- [x] Implement deterministic upload + verification path for R2.
- [x] Commit the generated manifest into `packages/cli/src/backgrounds/`.
- [x] Document the maintainer-only publish command and required auth surface.

## Success Criteria

- [x] Re-running the publish script without asset changes yields the same manifest content.
- [x] The committed manifest contains only public URLs, filenames, checksums, and sizes.
- [x] No repository secret or local `.env` data is printed, committed, or required by runtime installs.

## Risk Assessment

- High: public URL domain guessed wrong. Mitigation: require an explicit `--public-base-url` or env input and verify each object after upload.
- Medium: partial upload creates a manifest pointing at missing objects. Mitigation: write the manifest only after all uploads and checks succeed.

## Security Considerations

- Treat R2 credentials as maintainer-local only.
- Redact any auth/token values from logs and docs.

## Next Steps

Phase 2 consumes the committed manifest and turns it into a user-facing install command.
