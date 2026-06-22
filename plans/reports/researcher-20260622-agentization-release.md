---
title: "decor-cli agentization and release design"
date: "2026-06-22"
status: "DONE_WITH_CONCERNS"
scope: "npm CLI + MCP server + Claude skill + GitHub Actions release design"
---

# Research Report: decor-cli agentization and release design

## Executive Summary
Recommend a single TypeScript monorepo with one shared core and thin adapters: `packages/core`, `packages/cli`, `packages/mcp`, plus a repo-local Claude skill. This is the best fit for YAGNI/KISS/DRY because it keeps one source of truth for behavior, one release pipeline, and one test surface.

For releases, use semantic-release on conventional commits with `main` as stable (`latest`) and `dev` as prerelease (`beta`). That matches the documented semantic-release branch model and avoids manual versioning. For MCP, make `stdio` the default local transport, ship Streamable HTTP for remote use, and keep SSE only for compatibility. The HTTP transport must be treated as a security boundary, not a convenience layer.

## Method
- Sources: 3+ official docs plus local bootstrap plan and agentize skill
- Credibility weighting: official semantic-release and MCP docs > local skill/plan notes > inference from empty repo
- Local repo status: no `README.md` present; plan files are skeletal
- Key sources: semantic-release docs, MCP transport/architecture docs, agentize skill

## Ranked Recommendation
1. **Monorepo with shared core + CLI + MCP + skill**. Lowest drift, simplest maintenance, best long-term fit.
2. **CLI-only first, MCP later**. Lower initial surface, but weak fit because the requested target explicitly includes MCP and skill.
3. **Separate repos for CLI/MCP**. Not recommended. Duplication, release drift, and more CI overhead.

Architectural fit: the repo is effectively greenfield, so the safest path is the smallest structure that still supports both local automation and remote MCP access.

## Package Layout
Recommended layout:

```text
.
├── packages/
│   ├── core/        # pure business logic, no CLI/MCP imports
│   ├── cli/         # thin command adapter
│   └── mcp/         # transport/auth adapter
├── skills/
│   └── decor-cli/
│       └── SKILL.md
├── .github/workflows/
│   └── release.yml
├── package.json
├── tsconfig.base.json
└── README.md
```

Rationale: one core prevents behavior skew; thin adapters keep the CLI and MCP surfaces cheap to maintain.

## CLI Command Surface
Keep v1 small. Expose workflows, not every internal function.

This list is provisional. There is no README or code here, so the verbs are inferred from the phase names and the agentize pattern.

- `decor render` - primary workflow, input -> generated output
- `decor preview` - local preview/smoke render
- `decor validate` - validate config/templates before render
- `decor list-templates` - discover supported presets/templates
- `decor doctor` - environment/config diagnostics
- `decor config` - inspect resolved config and paths

CLI rules:
- `--json` on every command
- stable exit codes
- cross-platform paths only
- never print secret values

## MCP Tool Surface
Use snake_case verb-noun tools. Keep read-only tools clearly separated from mutating ones.

- `render_decor` - mutating, core workflow
- `preview_decor` - read-only or local-only preview
- `validate_decor` - read-only validation
- `list_templates` - read-only discovery
- `doctor` - read-only diagnostics
- `config_resolve` - read-only config resolution

MCP design rules:
- `stdio` default for local agents
- Streamable HTTP for remote deployments
- SSE only for compatibility, not the preferred path
- every tool description should state failure modes and whether confirmation is needed

## Release Workflow
Use one GitHub Actions workflow, triggered on pushes to `main` and `dev`.

Pipeline:
1. install
2. lint
3. test
4. build
5. semantic-release

semantic-release config:
- `main` -> stable `latest`
- `dev` -> prerelease `beta`
- conventional commits drive version selection
- `@semantic-release/npm` publishes to npm
- `@semantic-release/github` can attach release notes/assets if needed

Security posture for publishing:
- prefer npm trusted publishing/provenance
- if tokens are unavoidable, keep them only in GitHub Secrets
- never document secret values or checkout-time env contents in repo docs

## Security Boundaries
- CLI credentials: flag > env > local config > keychain, but never echo secret values
- MCP stdio: local process boundary, no network exposure by default
- MCP HTTP: require auth, validate `Origin`, bind localhost in dev
- companion skill: docs only, no credentials, no operational secrets

## Trade-offs
| Option | Performance | Complexity | Maintenance | Cost |
|---|---:|---:|---:|---:|
| Shared-core monorepo | High | Medium | Low | Low |
| Split repos | Medium | High | High | Medium |
| CLI-only first | High | Low | Medium | Low |

Shared-core monorepo wins because the tool surface is small and the user explicitly wants CLI + MCP + skill.

## Risks
- MCP HTTP expands attack surface; origin/auth mistakes are the main failure mode
- SSE support adds compatibility debt; keep it optional and documented as legacy
- semantic-release is stable, but branch naming/config drift can break beta/stable routing
- skill/CLI/tool drift if the skill is not regenerated from the same command list
- if the actual domain surface is larger than the plan hints, the v1 tool list may need pruning after scout

## What This Research Did Not Cover
- No live codebase because the worktree currently contains only the bootstrap plan files
- No README because none exists in this worktree
- No final package.json or CI file review because they are not present yet

## Sources
- Local plan: `plans/20260622-1635-decor-cli-bootstrap/plan.md`
- Local skill: `/Users/duynguyen/.agents/skills/agentize/SKILL.md`
- semantic-release overview: https://github.com/semantic-release/semantic-release
- semantic-release workflow config: https://github.com/semantic-release/semantic-release/blob/master/docs/usage/workflow-configuration.md
- semantic-release pre-releases: https://github.com/semantic-release/semantic-release/blob/master/docs/recipes/release-workflow/pre-releases.md
- semantic-release npm plugin: https://github.com/semantic-release/npm
- MCP transports: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
- MCP architecture: https://modelcontextprotocol.io/docs/learn/architecture

## Unresolved Questions
- Should `dev` prereleases use the `beta` dist-tag only, or also publish a GitHub prerelease?
- Does the eventual CLI need a `login` command, or can it stay env/config-only for v1?
- Is SSE required for any real client today, or can it be explicitly compatibility-only?
