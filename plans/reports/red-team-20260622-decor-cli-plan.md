# Red-team plan review: decor-cli bootstrap

Date: 2026-06-22
Scope: `plans/20260622-1635-decor-cli-bootstrap/*.md` plus requested researcher/decision reports.
Mode: plan review only, no code review. No `README.md` or `CLAUDE.md` exists in this worktree; `git diff HEAD~1` unavailable because repo has no prior commit.

## Overall assessment

Verdict: CAUTION.

The architecture direction is sane: shared TypeScript core, thin CLI/MCP adapters, real `sharp`/`ffmpeg` rendering, no login flow, real smoke tests, main/dev release lanes. But the plan is too optimistic for a secure first ship unless it adds sharper gates before code starts.

## Critical findings

### 1. URL/base64 input security contract is incomplete

Evidence: URL and base64 are locked v1 inputs (`plan.md:22`, `phase-02-core-renderer.md:27`), but mitigations only say protocol restriction, payload cap, streaming/temp cleanup (`plan.md:60`, `phase-02-core-renderer.md:74`, `phase-02-core-renderer.md:78`).

Risk: MCP HTTP + URL input can become authenticated SSRF and resource exhaustion. Explicit protocol checks do not stop redirects to private IPs, link-local metadata endpoints, DNS rebinding, huge chunked bodies, oversized base64 decode, long media duration, or decompression bombs.

Required plan change:
- Define input-source security contract before Phase 02: `http/https` only, redirect revalidation, DNS/IP denylist for private/link-local/loopback by default, timeout, max redirects, `Content-Length` precheck plus streaming byte cap, decoded base64 cap before allocation, MIME/media sniffing, max dimensions/duration.
- Add negative tests for localhost/private/link-local URLs, redirect-to-private, missing/lying `Content-Length`, malformed/oversized base64, and cleanup after failed probes.

### 2. HTTP MCP auth/origin boundary is underspecified

Evidence: HTTP is supported in v1 (`plan.md:25`, `phase-04-mcp-and-skill.md:28`), requires auth/origin checks (`phase-04-mcp-and-skill.md:31`, `phase-04-mcp-and-skill.md:58`, `phase-04-mcp-and-skill.md:74-75`), but the plan does not define token source, bind policy, CORS behavior, absent-Origin handling, body limits, or network opt-in.

Risk: A default or loosely bound HTTP listener exposes file reads/writes and render-side SSRF to the network. Origin validation is easy to get wrong because non-browser clients often omit `Origin`.

Required plan change:
- Default bind to `127.0.0.1`; require explicit `--host` for non-local.
- Require an explicit token/env for all network transports; no generated/default token in logs.
- Define allowed origins and absent-Origin behavior.
- Add request body size limits and auth-before-parse/tool-execution tests.
- Smoke valid token, missing token, wrong token, forbidden origin, absent origin, and non-local bind opt-in.

## Important findings

### 3. V1 scope lacks a minimum viable ship line

Evidence: v1 locks image + video, URL/base64, templates/config, annotations/shapes/spotlight, six CLI commands, MCP stdio/HTTP/SSE, docs, CI, and main/dev semantic-release (`plan.md:17`, `phase-03-cli-and-templates.md:27`, `phase-04-mcp-and-skill.md:27-28`). Phase 04 says HTTP/SSE can be dropped if risky (`phase-04-mcp-and-skill.md:80`), but Phase 06 success still requires HTTP (`phase-06-verification-and-ship.md:62`).

Risk: Implementation can get stuck trying to ship everything, or silently ship less than the locked plan.

Required plan change:
- Add explicit ship tiers: P1 must ship, P2 may defer, no silent scope cuts.
- Decide whether HTTP is a hard v1 blocker. If yes, delete the stdio-only rollback path. If no, adjust top-level locked scope and Phase 06 criteria.

### 4. Release workflow needs publish safety gates, not only dry-runs

Evidence: release runs on pushes to `main` and `dev` (`phase-05-ci-release-and-docs.md:36-37`), with dry-run validation later (`phase-06-verification-and-ship.md:28`, `phase-06-verification-and-ship.md:63`). Secrets/trusted publishing are mentioned, but branch protection, environment approvals, exact workflow permissions, and token exposure rules are not acceptance criteria (`phase-05-ci-release-and-docs.md:73-74`).

Risk: misconfigured branch or workflow env can publish stable/latest or beta unexpectedly. Dry-run passing locally does not prove the real GitHub Actions publish environment is safe.

Required plan change:
- Split CI/dry-run and publish jobs.
- Use minimal workflow permissions; prefer trusted publishing/provenance with `id-token: write`.
- Never expose npm/GitHub publish secrets on PR workflows.
- Require protected `main`/`dev` or protected release environments.
- Verify semantic-release branch routing inside GitHub Actions before real publish.

### 5. `ffmpeg-static` license/package decision is too late

Evidence: research flags GPL/package risk and says license was not validated (`researcher-20260622-media-rendering.md:70`, `researcher-20260622-media-rendering.md:105`). The plan defers decision to Phase 05 after core rendering is built (`plan.md:59`, `phase-05-ci-release-and-docs.md:49`).

Risk: implementation can build around a dependency that blocks npm publish/legal acceptance.

Required plan change:
- Close GPL/package-size acceptance in Phase 01 before dependency install, or implement static/system resolver from the start and test both paths where feasible.

### 6. Temp/output file safety is not precise enough

Evidence: cleanup is required (`phase-02-core-renderer.md:31`, `phase-02-core-renderer.md:51`, `phase-02-core-renderer.md:68`), and output path validation is mentioned (`phase-03-cli-and-templates.md:76`), but no atomic write, symlink, path traversal, concurrent job, or signal cleanup contract exists.

Risk: temp leaks, output overwrite, symlink clobber, partial files, and job collisions pass CI but hurt real users.

Required plan change:
- Use per-job `mkdtemp` under OS temp, random names, `finally` cleanup, and best-effort signal cleanup.
- Write outputs atomically; refuse implicit overwrite unless explicit.
- Reject output paths outside explicit destination rules and guard symlinks.
- Add concurrent render and failure cleanup tests.

### 7. Test plan needs hostile fixtures, not only happy-path real renders

Evidence: test matrix covers real render and metadata (`plan.md:52-56`, `phase-06-verification-and-ship.md:26-30`), but negative/security fixtures are not listed as success criteria.

Risk: “real binaries passed” can still miss auth bypass, SSRF, cleanup-on-error, release-lane drift, and path overwrite bugs.

Required plan change:
- Add local HTTP fixture server for URL tests; no internet dependency.
- Add malformed/oversize base64, SSRF redirect, HTTP auth/origin, output overwrite, cleanup-on-failure, and release dry-run-in-GitHub-Actions tests.
- Clarify whether tiny binary fixtures are intentionally tracked or generated; Phase 01 currently says no binary fixtures accidentally tracked (`phase-01-plan-and-scaffold.md:66`) while Phase 02 needs real tiny media fixtures (`phase-02-core-renderer.md:56`).

## Informational findings

- The plan’s proposed code file paths do not reference plan labels or finding IDs. Add a Phase 06 grep/check to keep source comments, migration names, test names, and filenames free of `phase-*`, `F123`, `audit`, and red-team labels.
- Research shows `skills/decor-cli` layout, while the locked plan uses `claude/skills/decor-cli` (`researcher-20260622-agentization-release.md:37-39`, `plan.md:20`). Align all docs to the repo-local `claude/skills/decor-cli` path to avoid duplicate skill trees.
- Phase 01 should pin a concrete Node version in `engines` and CI instead of “minimum supported by sharp” only (`phase-01-plan-and-scaffold.md:30`, `phase-01-plan-and-scaffold.md:70`).

## Positive observations

- Shared core + thin adapters is the right anti-drift boundary.
- No fake rendering is explicitly required.
- No `login` flow reduces credential persistence risk.
- `stdio` default for MCP is safer than HTTP-first.
- Docs are scheduled after command/tool contracts freeze.

## Recommended actions before code starts

1. Add URL/base64/input-source security contract and hostile tests to Phase 02.
2. Tighten HTTP MCP transport requirements in Phase 04.
3. Resolve HTTP hard-blocker vs optional-scope contradiction.
4. Move `ffmpeg-static` license/package acceptance to Phase 01.
5. Add release publish safety gates to Phase 05/06.
6. Add temp/output atomicity and cleanup requirements.
7. Add no-plan-label source artifact check to Phase 06.

## Unresolved questions

- Is Streamable HTTP a hard v1 release blocker, or can first prerelease ship with `stdio` only if HTTP security gates fail?
- Is bundling GPL `ffmpeg-static` acceptable for this npm package, or must system `ffmpeg` be the default?

**Status:** DONE_WITH_CONCERNS
**Summary:** Red-team plan review completed and report written. Plan is directionally sound but needs security, release, temp-file, and scope gate edits before implementation starts.
**Concerns/Blockers:** Critical concerns around URL/base64 SSRF/resource controls and HTTP MCP auth/origin boundary. No code reviewed.
