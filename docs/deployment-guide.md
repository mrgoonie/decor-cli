# Deployment Guide

## CLI

Build locally:

```bash
npm run build
node packages/cli/dist/bin/decor.js doctor
```

Publishable packages are `decor-cli`, `decor-cli-core`, and `decor-cli-mcp`.

## MCP

Local stdio:

```bash
decor-mcp --transport stdio
```

Streamable HTTP:

```bash
DECOR_MCP_TOKEN=example-token decor-mcp --transport http --host 127.0.0.1 --port 8080
```

Do not bind non-local hosts without an explicit token, allowed origins, and network controls.

## Release

`release.yml` verifies first, then publishes through the protected `release` environment.

- `main`: stable release
- `dev`: beta prerelease

Required repository secret:

- `NPM_TOKEN`: npm automation token with publish rights for `decor-cli`, `decor-cli-core`, and `decor-cli-mcp`.

The release job sets npm provenance metadata and publishes all three packages through semantic-release.

## Background Asset Hosting

Default backgrounds are hosted in Cloudflare R2 bucket `zuey`, prefix `decor-cli/default-backgrounds/`. The CLI package ships a generated manifest with public URLs and SHA-256 checksums.

When background source images change, run:

```bash
npm run backgrounds:publish -- --public-base-url https://pub-66925d6199b64be496dd68f8324a964a.r2.dev --env-file .env
```

Do not add Cloudflare credentials to release workflows unless automated asset publishing becomes necessary.
