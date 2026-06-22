---
phase: 4
title: "MCP and skill"
status: completed
priority: P1
effort: 1.5d
dependencies: [2, 3]
---

# Phase 04: MCP and skill

## Context links
- `plans/reports/researcher-20260622-agentization-release.md:67-109`
- `plans/reports/researcher-20260622-agentization-release.md:120-145`
- `plans/reports/agentize-decisions-decor-cli.md`
- `/Users/duynguyen/.agents/skills/agentize/SKILL.md`

## Overview
Expose the core workflows through a safe MCP server in `packages/mcp` and document the usage in `claude/skills/decor-cli`. This phase keeps tool names, input shapes, and failure modes aligned with the CLI rather than inventing a parallel surface.

## Key insights
- `stdio` is the default local transport; HTTP is a deliberate security boundary, not a convenience shortcut.
- Streamable HTTP is a hard v1 gate and the preferred remote transport; SSE exists only for compatibility.
- The skill is documentation and workflow guidance only; it must not add credential storage or hidden behavior.

## Requirements
- Functional: ship MCP tools `render_decor`, `preview_decor`, `validate_decor`, `list_templates`, `doctor`, and `config_resolve`.
- Functional: support `stdio` by default, Streamable HTTP as the primary network transport, and SSE only behind an explicit compatibility option.
- Functional: reuse core config/template resolution and the same request schemas as the CLI.
- Functional: add a repo-local skill in `claude/skills/decor-cli` with install, config, and top workflow guidance for the CLI and MCP surfaces.
- Non-functional: every tool must document failure modes, mutability, and confirmation expectations; HTTP must require auth before parsing request bodies or executing tools.
- Non-functional: HTTP binds to `127.0.0.1` by default; any non-local bind requires explicit `--host`; request bodies have size limits; allowed origins are explicit; absent `Origin` is accepted only for bearer-authenticated non-browser clients.

## Architecture
Data flow:
1. MCP transport parses inbound JSON payloads and authenticates network requests.
2. Tool handlers validate inputs against shared core schemas.
3. Tool adapters call the same core functions used by the CLI.
4. Tool responses return a short human summary plus structured machine data.
5. The skill references only published commands, tool names, and config behavior already locked in phases 02 and 03.

## Related code files
- Own: `packages/mcp/**`, `claude/skills/decor-cli/**`.
- Create: `packages/mcp/src/server.ts`, `packages/mcp/src/transports/start-stdio-server.ts`, `packages/mcp/src/transports/start-http-server.ts`, `packages/mcp/src/transports/start-sse-server.ts`, `packages/mcp/src/tools/*.ts`, `packages/mcp/src/auth/*.ts`, `packages/mcp/test/**`, `claude/skills/decor-cli/SKILL.md`.
- Modify: `packages/mcp/package.json`, `packages/core/src/index.ts` only if schema exports need widening, `README.md` or docs stubs only if brief cross-links are needed before phase 05.
- Delete: none.

## Implementation steps
1. Define shared MCP input and output envelopes directly from core schemas.
2. Implement tool handlers for render, preview, validate, template listing, doctor, and config resolution.
3. Add `stdio` startup as the default entry, then add Streamable HTTP with bearer-token auth, localhost-first defaults, explicit non-local opt-in, origin policy, and request body limits.
4. Add SSE transport behind an explicit compatibility flag and document it as non-preferred.
5. Write MCP tests for tool registration, stdio round-trips, valid token, missing token, wrong token, forbidden origin, absent-origin authenticated requests, non-local bind opt-in, auth-before-parse, and transport boot behavior.
6. Write `claude/skills/decor-cli/SKILL.md` so it references the exact command/tool names, config sources, and common workflows.

## Todo list
- [ ] All six MCP tools exist and map to core functions.
- [ ] `stdio` boot path is the default.
- [ ] Streamable HTTP requires auth and has origin checks.
- [ ] Streamable HTTP passes auth-before-parse, body-limit, origin, and non-local bind tests.
- [ ] SSE is clearly compatibility-only.
- [ ] Repo-local skill matches the real CLI and MCP behavior.

## Success criteria
- [ ] A local agent can call `render_decor` over `stdio` and receive a structured render result.
- [ ] HTTP mode rejects missing or invalid auth before request parsing and tool execution.
- [ ] Streamable HTTP is implemented and tested; first prerelease does not ship with `stdio` only.
- [ ] Tool descriptions clearly state mutating versus read-only behavior.
- [ ] The skill file contains no secret values and no workflow that diverges from the shipped commands/tools.

## Risk assessment
- High x High: HTTP auth or origin bugs expose render tools remotely. Mitigation: mandatory token checks, localhost dev defaults, explicit auth tests.
- Medium x Medium: CLI and MCP drift in config handling. Mitigation: import loaders from core instead of reimplementing them.
- Low x Medium: SSE compatibility path rots. Mitigation: keep it optional, lightly tested, and documented as secondary.

## Security considerations
- Require bearer-token auth for all network transports.
- Validate `Origin`, bind to localhost by default in dev HTTP mode, require explicit `--host` for non-local bind, and enforce body size limits.
- Keep the skill documentation-only; no secret capture, storage, or hidden setup steps.

## Rollback
- Revert `packages/mcp/**` and `claude/skills/decor-cli/**` independently of CLI work.
- If HTTP transport proves risky, block v1 shipping until fixed; do not silently ship a `stdio`-only prerelease against this plan.

## Next steps
Phase 05 packages the now-stable command and tool surfaces into CI, docs, and release automation.
