# Project Changelog

## 2026-06-22

- Add `decor install-backgrounds` to install hosted default backgrounds into `~/.decor-cli/backgrounds`.
- Upload the default background pack to Cloudflare R2 bucket `zuey` under `decor-cli/default-backgrounds/`.
- Add checksum-verified, atomic background downloads and a maintainer publish script for regenerating the manifest.

## 0.1.0

- Bootstrap TypeScript monorepo.
- Add shared render core with image and video paths.
- Add CLI, MCP server, docs, tests, and release workflows.
- Harden URL, Base64, MCP HTTP, and output-write safety before first release.
- Wire npm publish lanes for stable and beta semantic-release channels.
