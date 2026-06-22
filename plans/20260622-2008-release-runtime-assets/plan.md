# Release Runtime Assets Plan

## Context
- Source request: `ck:vibe --ship CI release thieu arch`
- Failure evidence: `github: no matching asset for runtime (os=linux, arch=amd64); available:`
- Current evidence: GitHub release `v1.1.0` has no assets.
- Route: bugfix
- Mode: official

## Outcome
GitHub releases include runtime-named archives so installers can match assets such as `linux-amd64`.

## Acceptance Criteria
- Release workflow builds GitHub assets before the GitHub release publish step.
- Asset names include OS and arch tokens for common runtimes, including `linux-amd64`.
- Archives expose root executable wrappers for `decor`, `decor-cli`, and `decor-mcp`.
- Local validation can build at least the `linux-amd64` archive and inspect its contents.
- CI passes after the release workflow changes.
- Existing `v1.1.0` release is backfilled with compatible assets or a newer release with assets is published and verified.

## Implementation Notes
- Use semantic-release prepare hook to generate assets only when a release is actually being prepared.
- Upload generated assets through `@semantic-release/github`.
- Keep generated assets out of git.
- Do not include secrets in issue, PR, or logs.

## Validation
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run release:assets -- 0.0.0-test --targets linux-amd64`
- Inspect archive file names and root entries.
