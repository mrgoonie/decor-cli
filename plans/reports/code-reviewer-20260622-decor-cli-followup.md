## Code Review Summary

### Controller Update
- 2026-06-22 18:05 +07: fixed the remaining hex IPv4-mapped IPv6 blocker in `packages/core/src/input/ip-policy.ts`.
- Added regression coverage for `::ffff:7f00:1` and `::ffff:a9fe:a9fe` in `packages/core/test/io-and-policy.test.ts`.
- Re-ran full gate after the fix: `npm run typecheck && npm test && npm run test:coverage && npm run build && npm run lint && npm run smoke:render && npm run smoke:cli && npm run smoke:mcp && npm audit --omit=dev && npm run release:dry-run && npm pack --workspaces --dry-run` passed.
- Current blocker status: resolved.

### Scope
- Files: prior blocker follow-up only: config merge, URL/IP/base64 input, MCP HTTP auth, MCP preview, video output safety, CLI validate, semantic-release config.
- LOC: 1,002 lines in requested source/test/release files.
- Focus: follow-up against earlier blocking findings in `plans/reports/code-reviewer-20260622-decor-cli.md`.
- Scout findings: `git diff --name-only HEAD~1` unavailable because this worktree has only one commit; `git status` shows source tree untracked. Used user-provided file list, prior report, `rg`, direct source reads, and targeted runtime checks.

### Overall Assessment
One earlier blocker remains actionable: URL IP policy still misses hex-form IPv4-mapped IPv6 addresses, so SSRF/IP policy is incomplete. Other reviewed blockers appear resolved in code and targeted tests. Full Vitest suite passes.

### Critical Issues
- [packages/core/src/input/ip-policy.ts:32] IPv4-mapped IPv6 detection only matches dotted form. `::ffff:7f00:1` and `::ffff:a9fe:a9fe` return allowed, representing loopback and metadata/link-local addresses. A hostile DNS AAAA answer can bypass the deny check used by [packages/core/src/input/resolve-input-source.ts:36] before the URL request is pinned.
  Fix: normalize IPv4-mapped IPv6 in dotted and hex forms before private/link-local/metadata checks. Add tests for `::ffff:7f00:1`, `::ffff:a9fe:a9fe`, and a DNS-returned mapped AAAA URL flow.

### High Priority
- None beyond the critical SSRF/IP policy gap above.

### Medium Priority
- None in the original blocker set.

### Low Priority
- [packages/mcp/test/http-auth.test.ts:64] MCP body gate is unit-tested for missing/oversized `Content-Length`, not with real chunked HTTP requests through `startHttpServer`.
  Fix: add transport integration test proving chunked/no-length body rejected before SDK parsing.
- [packages/core/test/render-video.test.ts:10] Video atomic path has a success test, but no failure cleanup or implicit-overwrite regression test.
  Fix: add tests for existing output with `overwrite: false` and failed ffmpeg encode leaves final output untouched.
- [packages/cli/test/program.test.ts:5] CLI validate error boundary has source fix but no negative CLI test for invalid JSON/Zod output.
  Fix: add CLI validate invalid-config test asserting no stack trace and expected exit code.
- [release.config.cjs:2] Release config includes `dev` beta branch, but `git ls-remote --heads origin main dev` returned only `main`.
  Fix: create/protect `dev` before relying on beta publishing, or update docs if beta branch is future ops.

### Resolved Blockers
- Template default merging: resolved. `normalizeRenderRequest` validates template name, then merges `template.defaults` with raw user input at [packages/core/src/config/merge-render-request.ts:21]. Tests cover direct normalize and config loading at [packages/core/test/config-and-background.test.ts:12] and [packages/core/test/config-and-background.test.ts:24].
- URL DNS pinning: mostly resolved. URL requests now resolve once and pin the checked address through the `lookup` override at [packages/core/src/input/resolve-input-source.ts:65]. Redirects re-run URL safety before requesting at [packages/core/src/input/resolve-input-source.ts:81]. Remaining gap is hex IPv4-mapped IPv6 above.
- Strict base64: resolved. Data URI syntax and base64 alphabet/padding are checked at [packages/core/src/input/resolve-input-source.ts:105]. Negative tests cover malformed base64 at [packages/core/test/io-and-policy.test.ts:63].
- MCP HTTP auth/origin/body gates: resolved for original chunked/no-origin blocker. Bearer auth runs before body parsing at [packages/mcp/src/auth/http-auth.ts:20], body methods require and cap `Content-Length` at [packages/mcp/src/auth/http-auth.ts:25], and Origin is denied unless explicitly listed at [packages/mcp/src/auth/http-auth.ts:40]. Tests cover origin matrix and body limit at [packages/mcp/test/http-auth.test.ts:42].
- Preview overwrite behavior: resolved. `preview_decor` no longer forces `overwrite: true`; it normalizes caller args then runs the normal render pipeline at [packages/mcp/src/tools/register-tools.ts:45].
- Atomic/safe video output: resolved in source. Video reserves a temp output at [packages/core/src/render/render-video.ts:16], writes ffmpeg output to `reserved.tempPath` at [packages/core/src/render/render-video.ts:46], publishes atomically at [packages/core/src/render/render-video.ts:48], and cleans temp on error at [packages/core/src/render/render-video.ts:50].
- CLI validate error boundary: resolved in source. `validate` wraps config load in `try/catch`, prints formatted errors, and sets `process.exitCode` at [packages/cli/src/commands/utility-commands.ts:23].
- semantic-release npm publishing config: resolved in config. `@semantic-release/npm` is present for core, CLI, and MCP at [release.config.cjs:11]. Release workflow passes `NODE_AUTH_TOKEN` and provenance flag to semantic-release at [.github/workflows/release.yml:54].

### Edge Cases Found by Scout
- Hex-form IPv4-mapped IPv6 was missed by the new IP tests: `npx tsx` check returned `false` for `::ffff:7f00:1` and `::ffff:a9fe:a9fe`.
- `npm run release:dry-run -- --no-ci` loaded all three npm plugin instances, but did not simulate publish because current branch is `feature/bootstrap-decor-cli`.
- `npm view decor-cli*` returned 404 for all three package names, expected before first publish but means live npm ownership/publish rights still unproven.

### Positive Observations
- Tests increased around template defaults, malformed base64, mapped IPv6 dotted form, MCP origin matrix, and video render path.
- Output safety now shares the image atomic writer primitives for video.
- Release workflow separates verify and protected publish jobs with npm token/provenance environment.

### Recommended Actions
1. Fix hex IPv4-mapped IPv6 normalization in `isDeniedIp`.
2. Add the three low-cost regression tests listed above.
3. Create/protect `dev` branch or document beta lane as future setup.

### Metrics
- Type Coverage: not measured. Core package no-emit typecheck passed; CLI/MCP isolated no-emit typechecks failed because referenced core `dist` declarations were not freshly built.
- Test Coverage: not measured. `npm test` passed 8 files, 18 tests.
- Linting Issues: `npm run check:source-labels` passed. Root `npm run lint` skipped because root typecheck emits build artifacts.

### Verification
- `cat README.md`: read first for project context.
- `find . -maxdepth 2 -name CLAUDE.md -print`: no local `CLAUDE.md` found.
- `cat docs/code-standards.md`: read.
- `git diff --name-only HEAD~1`: failed, no `HEAD~1` in this one-commit worktree.
- `git status --short`: tree contents are untracked.
- `npm test`: passed, 8 test files, 18 tests.
- `npm run typecheck -w decor-cli-core`: passed.
- `npm run typecheck -w decor-cli`: failed TS6305 because core referenced declarations not built from source under isolated no-emit.
- `npm run typecheck -w decor-cli-mcp`: failed TS6305/TS7006 due same isolated no-emit/stale declaration path.
- `npx tsc -b packages/core packages/cli packages/mcp --noEmit`: failed TS6310 because referenced projects may not disable emit.
- `npm run check:source-labels`: passed.
- `npm run release:dry-run -- --no-ci`: passed config load, skipped publish because branch is not configured release branch.
- `git ls-remote --heads origin main dev`: only `main` returned.
- `npm view decor-cli-core version`, `npm view decor-cli version`, `npm view decor-cli-mcp version`: all 404, packages not yet published.
- `npm run build`: skipped, rewrites generated `dist` files.
- `npm run lint`: skipped, root typecheck/build mode can rewrite generated `dist` files.

### Unresolved Questions
- Is the `dev` beta branch expected to exist before this landing, or is beta publishing a post-merge repo setup task?

**Status:** DONE_WITH_CONCERNS
**Summary:** Follow-up review completed and report saved. Six blocker clusters resolved; URL SSRF/IP policy still has one critical mapped-IPv6 bypass.
**Concerns/Blockers:** Fix `isDeniedIp` hex IPv4-mapped IPv6 handling before landing.
