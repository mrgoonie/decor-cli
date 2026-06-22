# 2026-06-22 decor-cli bootstrap

Bootstrapped `decor-cli` as a TypeScript monorepo with shared core, CLI, MCP server, repo-local skill, docs, tests, CI, and semantic-release config.

Key decisions:
- Use system `ffmpeg`/`ffprobe`, not bundled static ffmpeg.
- Keep URL inputs guarded by protocol, DNS/IP, redirect, and byte limits.
- Treat Streamable HTTP MCP as a v1 gate with bearer auth and origin checks.

Validation:
- Typecheck, tests, build, lint, and smoke checks pass locally.
- Runtime dependency audit is clean.
- Full dev audit has one semantic-release bundled npm/undici advisory with no current upstream non-breaking fix.
