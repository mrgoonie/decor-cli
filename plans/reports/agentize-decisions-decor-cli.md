---
title: "decor-cli bootstrap decisions"
date: "2026-06-22"
status: "DONE"
scope: "Locked v1 decisions for bootstrap, agentization, and release planning"
---

# Decision record: decor-cli bootstrap

## Inputs
- Rendering architecture evidence: `plans/reports/researcher-20260622-media-rendering.md:5-30`, `plans/reports/researcher-20260622-media-rendering.md:42-73`, `plans/reports/researcher-20260622-media-rendering.md:93-100`
- Agentization and release evidence: `plans/reports/researcher-20260622-agentization-release.md:10-14`, `plans/reports/researcher-20260622-agentization-release.md:21-109`, `plans/reports/researcher-20260622-agentization-release.md:142-145`

## Locked decisions
| Topic | Decision | Reason |
|---|---|---|
| Workspace | One TypeScript monorepo with `packages/core`, `packages/cli`, `packages/mcp`, `claude/skills/decor-cli`, docs, and GitHub workflows | One source of truth and lowest drift |
| Rendering engine | `sharp` for image jobs, system `ffmpeg` plus `ffprobe` for video jobs; env overrides are `DECOR_FFMPEG_PATH` and `DECOR_FFPROBE_PATH` | Real video support without bundling GPL static binaries |
| Input surface | Local path, URL, and base64 are all first-class | Required v1 scope from rendering report |
| Scene surface | Templates, default config, annotations, shapes, arrows, spotlight, rounded frame, and shadow are in v1 | Shared scene graph keeps CLI and MCP aligned |
| CLI auth | No `login` command in v1; resolve from flags, env, and config only | Cuts persistence complexity and matches stated scope |
| MCP transports | `stdio` default; Streamable HTTP is a hard v1 gate; SSE compatibility-only | Matches local-agent default plus required remote-host option |
| Release lanes | `main` publishes stable `latest`; `dev` publishes npm `beta` and a GitHub prerelease | Resolves the prerelease ambiguity explicitly |
| Skill scope | Repo-local guidance skill only; no hidden runtime behavior or secrets | Keeps the skill as documentation and workflow glue |
| URL/base64 security | Enforce protocol, DNS/IP denylist, redirect revalidation, byte/time/probe limits, and hostile negative tests | Prevents SSRF and resource exhaustion across CLI and MCP |
| Release safety | Split CI/dry-run from protected publish jobs; no publish secrets on PR workflows | Prevents accidental stable or beta publish |

## Non-goals
- Browser-based or mocked rendering paths
- Animated overlay timelines beyond a static frame pipeline
- Credential capture or keychain-backed login flows
- Treating SSE as the preferred remote transport
- Splitting CLI and MCP into separate repos
- Bundling GPL static ffmpeg binaries in the npm package
- Shipping a `stdio`-only prerelease against this v1 plan

## Open risks
- User machines may lack system `ffmpeg`; `doctor`, install docs, env overrides, and CI coverage are required.
- Font/rendering drift across OSes still needs golden-fixture validation.

## Unresolved questions
None.
