## Code Review Summary

### Scope
- Files: `packages/core/**`, `packages/cli/**`, `packages/mcp/**`, `scripts/**`, `.github/workflows/**`, `README.md`, `docs/**`, `claude/skills/decor-cli/SKILL.md`, `release.config.cjs`, `package.json`
- LOC: ~1,700 TypeScript source lines; ~12,056 total lines in requested scope including docs/generated artifacts
- Focus: pending greenfield implementation; entire tree is untracked relative to `HEAD`, so review used `git status`, `rg --files`, plan files, and direct source inspection instead of `git diff HEAD~1`
- Scout findings: shared `normalizeRenderRequest` affects CLI + MCP; `resolveInputSource` is the SSRF boundary for all adapters; `authorizeHttp` is shared by HTTP + SSE; video write path bypasses image atomic writer; release config is not wired to npm publishing

### Overall Assessment
Not ready to land. TypeScript passes, but tests fail and several promised safety gates are incomplete: template defaults do not apply, URL SSRF policy is bypassable, MCP body/origin limits are weaker than spec, video/MCP preview can violate output safety, and semantic-release cannot publish npm packages as configured.

### Critical Issues
- [packages/core/src/config/merge-render-request.ts:10] Template merge parses defaults before applying the template, so missing user fields become core defaults and then override template defaults at lines 25-32. `npm test` fails at `packages/core/test/config-and-background.test.ts:19`: expected `editorial-light` background `solid`, got `gradient`.
  Fix: apply template defaults before final schema defaults, or track explicit user fields before `RenderRequestSchema.parse`; add tests for each built-in template.

- [packages/core/src/input/resolve-input-source.ts:19] URL SSRF protection only pre-checks DNS, then `fetch` resolves/connects independently at line 58. DNS rebinding can pass the pre-check with a public IP then connect to loopback/private/metadata on the actual fetch. Also [packages/core/src/input/ip-policy.ts:30] misses IPv4-mapped IPv6 results; `::ffff:127.0.0.1` and `::ffff:169.254.169.254` return allowed.
  Fix: deny IPv4-mapped IPv6/private ranges and pin the checked address into the actual connection path, or verify the connected remote address. Add redirect, rebinding-capable resolver, mapped-IPv6, and metadata tests.

- [packages/mcp/src/auth/http-auth.ts:25] MCP body limit only trusts `Content-Length`; chunked/no-length authenticated requests can proceed to SDK parsing without a streaming byte cap. [packages/mcp/src/auth/http-auth.ts:31] also accepts any browser `Origin` when `allowedOrigins` is empty, despite the plan requiring explicit origins.
  Fix: enforce byte counting before handing to the MCP transport, reject all Origin-bearing requests unless origin is explicitly configured, and keep absent Origin allowed only after bearer auth.

- [release.config.cjs:7] The explicit semantic-release `plugins` list omits `@semantic-release/npm`, so package versions are not prepared and no npm package is published. This contradicts `plan.md` release decision `dev -> npm beta` and `main -> latest`.
  Fix: add a real npm/workspace publish strategy, wire trusted publishing/OIDC or `NPM_TOKEN`, and make dry-runs prove `decor-cli`, `decor-cli-core`, and `decor-cli-mcp` publish routing.

### High Priority
- [packages/mcp/src/tools/register-tools.ts:46] `preview_decor` silently forces `overwrite: true`. A caller can clobber an existing file even if the request did not opt in to overwrite, breaking output safety and CLI/MCP parity.
  Fix: preserve caller overwrite intent or write previews to a unique temp/preview destination.

- [packages/core/src/render/render-video.ts:24] Video output is pre-checked, then ffmpeg writes directly to the final path with `-y` at lines 26-44. This is not atomic, can leave partial files on failure, and re-opens a symlink/TOCTOU window after `assertOutputAllowed`.
  Fix: render to a random temp file in the target directory, then use the same atomic rename policy as images; do not pass final path directly to ffmpeg.

- [packages/core/src/input/resolve-input-source.ts:97] Malformed base64 is not rejected before probing because `Buffer.from(value, "base64")` accepts junk/empty payloads. Example: `"not-base64"` decodes to bytes instead of throwing.
  Fix: validate base64/data URI syntax and round-trip or strict-decode before allocation/probe; return `invalid_input`.

- [packages/cli/src/commands/utility-commands.ts:23] `decor validate` has no error boundary. Invalid JSON/Zod errors escape the command handler, producing Node stack traces and unstable exit behavior instead of the CLI error contract.
  Fix: wrap utility commands with the same `printError`/`exitCodeFor` path used by render/preview.

### Medium Priority
- [packages/core/src/render/render-video.ts:48] Video result metadata ignores crop-adjusted dimensions when output width/height are unset. Actual rendered frames use cropped dimensions via `renderImageToBuffer`, but reported dimensions use original metadata.
  Fix: derive media result from rendered frame metadata or shared scene geometry after crop.

- [packages/core/src/input/resolve-input-source.ts:25] URL download does not enforce response MIME/content sniffing before writing/probing, despite the plan requiring MIME/media sniffing.
  Fix: check `Content-Type` where available and sniff first bytes; keep final probe validation.

- [scripts/smoke-cli.ts:3] CLI smoke only runs `list-templates`; [scripts/smoke-mcp.ts:3] only creates/closes a server. They do not verify render path, URL/base64 inputs, MCP stdio/HTTP execution, or auth/origin/body behavior.
  Fix: make smoke scripts cover the promised end-to-end surfaces or remove completion claims tied to them.

### Low Priority
- Generated artifacts under `packages/*/dist` and compiled `packages/*/test/*.js|*.d.ts|*.map` are untracked but not ignored by current `.gitignore` patterns. This makes review/commit scope noisy.
  Fix: ignore `packages/*/dist` and generated test artifacts, or intentionally track them with a clear packaging policy.

### Edge Cases Found by Scout
- DNS check/connect split can turn URL input into authenticated SSRF via MCP.
- Shared template merge bug breaks CLI render, MCP render, preview, validate, and config resolution together.
- HTTP/SSE share `authorizeHttp`, so body/origin mistakes affect both network transports.
- Video renderer uses a different output path than image renderer, so image write safety tests do not cover video.
- Existing tests do not cover redirects to denied hosts, chunked MCP bodies, absent/explicit Origin matrix, malformed base64, MCP tool round-trips, CLI URL/base64 E2E, or output cleanup on failed video encode.

### Positive Observations
- Core/CLI/MCP package split is mostly clean; adapters generally call core rather than reimplement rendering.
- TypeScript strict/no-emit typecheck passes.
- Child processes use argv arrays, not shell interpolation.
- Image and video tests execute real `sharp` and `ffmpeg`.
- Temp workspaces use `mkdtemp` and cleanup in `finally` for the main render path.

### Recommended Actions
1. Fix template normalization and get `npm test` green.
2. Harden URL fetching against DNS rebinding and IPv4-mapped private addresses.
3. Enforce MCP streaming body limits and explicit Origin policy.
4. Restore output safety for `preview_decor` and video writes.
5. Add strict malformed-base64 validation and negative tests.
6. Wire semantic-release to actually publish all npm packages on `main`/`dev`.
7. Expand high-risk integration tests before release.

### Metrics
- Type Coverage: not measured; strict TypeScript no-emit check passed.
- Test Coverage: not measured; `npm test` ran 12 tests, 1 failed.
- Linting Issues: source-label check passed; no ESLint configured. `npm audit --omit=dev` found 0 prod vulnerabilities; full dev audit reports 1 high advisory in transitive `npm/node_modules/undici`.

### Verification
- `npm run typecheck`: passed.
- `npm test`: failed, 1 failing test in `packages/core/test/config-and-background.test.ts`.
- `npm run check:source-labels`: passed.
- `npm audit --omit=dev --audit-level=moderate`: passed, 0 vulnerabilities.
- `npm audit --audit-level=moderate`: failed, 1 high dev/transitive `undici` advisory via bundled npm/semantic-release path.
- `npm run build`: not run to avoid rewriting generated `dist` files in a no-edit review.

### Unresolved Questions
- Should MCP HTTP fail startup when `--allowed-origins` is omitted, or start but reject every Origin-bearing browser request? Current plan text implies explicit origins.

**Status:** DONE_WITH_CONCERNS
**Summary:** Review completed and report saved. Implementation has blocking correctness, security, release, and failing-test issues.
**Concerns/Blockers:** `npm test` fails; SSRF/body/origin/output-safety/release publishing blockers should be fixed before landing.
