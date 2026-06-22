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
