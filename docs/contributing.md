# Contributing

## Setup

```bash
npm install
npm run typecheck
npm test
```

Install system `ffmpeg` for video tests.

## Release

Use conventional commits. `main` is stable, `dev` is beta.

## Default Background Assets

Default backgrounds are hosted in Cloudflare R2 and described by `packages/cli/src/backgrounds/default-background-manifest.ts`. The runtime installer reads only that committed manifest and never reads `.env`.

Maintainer publish flow:

```bash
npm run backgrounds:publish -- --public-base-url https://pub-66925d6199b64be496dd68f8324a964a.r2.dev --env-file .env
```

The script uploads `examples/backgrounds/*` to bucket `zuey` under `decor-cli/default-backgrounds/`, verifies every public URL, and rewrites the manifest with filename, URL, byte length, content type, and SHA-256.
