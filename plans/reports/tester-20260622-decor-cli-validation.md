# decor-cli validation report

Date: 2026-06-22
Work context: `/Volumes/GOON/www/oss/decor-cli-feature-bootstrap`
Branch: `feature/bootstrap-decor-cli`

## Test Results Overview

- `npm run typecheck` - pass
- `npm test` - pass
- `npm run build` - pass
- `npm run lint` - pass
- `npm run smoke:render` - pass
- `npm run smoke:cli` - pass
- `npm run smoke:mcp` - pass
- `npm audit --omit=dev` - pass, `found 0 vulnerabilities`
- `npm run release:dry-run` - pass for expected behavior; semantic-release loaded and refused publish on feature branch
- `npm run test:coverage` - fail, missing dependency `@vitest/coverage-v8`

## Coverage Metrics

- Coverage report not generated.
- Current blocker is tooling, not test failures: Vitest coverage provider is not installed.

## Failed Tests / Commands

- `npm run test:coverage`
  - Error: `MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'`
  - Impact: coverage numbers unavailable until the provider is added or the script is adjusted.

## Performance / Runtime Notes

- `npm test` completed in 3.52s according to Vitest output.
- `render` smoke completed successfully and produced `/var/folders/f9/tth74dcd50s99ss40mmrf6xw0000gp/T/decor-smoke-Rygfs8/output.png`.

## Build Status

- Build passed for all workspaces:
  - `decor-cli-core`
  - `decor-cli`
  - `decor-cli-mcp`

## Release Dry-Run Status

- `semantic-release --dry-run` loaded successfully.
- It correctly refused to publish from `feature/bootstrap-decor-cli`:
  - semantic-release reported the branch is configured to publish only from `main`.

## Critical Issues

- Coverage script is broken due missing `@vitest/coverage-v8`.

## Residual Risks

- Dev-tooling audit findings were not inspected because the requested command was `npm audit --omit=dev`.
- Coverage remains unverified until the Vitest coverage provider is added.

## Recommendations

1. Add `@vitest/coverage-v8` to devDependencies or change the coverage provider configuration.
2. Run a full `npm audit` if you want dev-tooling risk surfaced explicitly.
3. Re-run `npm run test:coverage` after the coverage dependency is fixed.
