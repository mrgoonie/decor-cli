---
phase: 3
title: "CLI and templates"
status: completed
priority: P1
effort: 1.5d
dependencies: [2]
---

# Phase 03: CLI and templates

## Context links
- `plans/reports/researcher-20260622-media-rendering.md:17-30`
- `plans/reports/researcher-20260622-media-rendering.md:75-91`
- `plans/reports/researcher-20260622-agentization-release.md:49-66`
- `plans/reports/agentize-decisions-decor-cli.md`

## Overview
Build the publishable CLI in `packages/cli`, wire it to the real core renderer, and lock the template plus default-config experience. This phase defines the human-facing workflow surface and makes the render engine usable without MCP.

## Key insights
- The CLI should expose workflows, not internal helpers.
- Template resolution and config merging must be shared behavior, not duplicated per command.
- V1 explicitly excludes `login`; diagnostics must explain missing credentials/config without storing secrets.

## Requirements
- Functional: ship `decor render`, `decor preview`, `decor validate`, `decor list-templates`, `decor doctor`, and `decor config`.
- Functional: support `--json` across commands, stable exit codes, and cross-platform path handling.
- Functional: resolve built-in templates plus project-level default config and merge them with explicit CLI flags before calling core.
- Functional: expose the same local path, URL, and base64 input options available in the core layer.
- Non-functional: no fake preview path; `preview` must call the real core pipeline with a low-cost output strategy.

## Architecture
Data flow:
1. `commander` parses argv into a command-specific raw payload.
2. Config loaders resolve project defaults, template defaults, env overrides, and explicit flags.
3. Command handlers normalize input into the shared `render-request`.
4. CLI handlers call `packages/core` and map results into human or JSON output plus stable exit codes.
5. `doctor` and `config` inspect resolved paths and credential sources without printing secret values.

## Related code files
- Own: `packages/cli/**`, `packages/core/src/templates/**`, `packages/core/src/config/**`.
- Create: `packages/cli/src/bin/decor.ts`, `packages/cli/src/commands/render-command.ts`, `packages/cli/src/commands/preview-command.ts`, `packages/cli/src/commands/validate-command.ts`, `packages/cli/src/commands/list-templates-command.ts`, `packages/cli/src/commands/doctor-command.ts`, `packages/cli/src/commands/config-command.ts`, `packages/cli/src/formatters/*.ts`, `packages/cli/test/**`, `packages/core/src/templates/*.ts`, `packages/core/src/config/*.ts`.
- Modify: `packages/cli/package.json`, `packages/core/src/index.ts`, any shared schema exports required for template and config resolution.
- Delete: none.

## Implementation steps
1. Define CLI command contracts, exit-code mapping, and shared `--json`, `--quiet`, and `--verbose` behavior.
2. Implement config resolution from flags, env, project config, and built-in defaults without adding secret persistence.
3. Add a template registry with a small v1 starter set and a versioned default config shape.
4. Implement each command as a thin adapter over core functions; `preview` should reuse the render pipeline with cheaper defaults, not a separate renderer.
5. Add CLI integration tests for happy paths, validation failures, missing input, and JSON output.
6. Add smoke fixtures proving path, URL, and base64 inputs all work from the CLI.

## Todo list
- [ ] All six CLI commands exist and show help text.
- [ ] Template registry and default config are versioned.
- [ ] `render` and `preview` call the real core pipeline.
- [ ] `validate`, `doctor`, and `config` produce stable machine-readable output.
- [ ] CLI tests cover exit codes and JSON output.

## Success criteria
- [ ] `decor render` produces a real output file from a local path, a URL, and a base64 input.
- [ ] `decor preview` completes without a second rendering code path.
- [ ] `decor validate` catches invalid templates and invalid config before rendering starts.
- [ ] `decor doctor` identifies the config layer in use and never reveals secret values.

## Risk assessment
- Medium x High: config merge drift between CLI and MCP. Mitigation: keep loaders in core and reuse them in phase 04.
- Medium x Medium: command surface sprawl. Mitigation: freeze the six-command v1 list and defer anything else.
- Low x Medium: preview semantics diverge from render. Mitigation: preview must call the same core entry point with different output defaults only.

## Security considerations
- Never persist credentials or add a `login` flow in v1.
- Redact secrets and signed URLs in CLI output and error messages.
- Validate file paths before writing outputs to avoid accidental overwrite outside explicit targets.

## Rollback
- Revert `packages/cli/**` and template/config UX changes without modifying core render internals.
- Keep shared template schema versioning if later phases already depend on it.

## Next steps
Phase 04 uses the finalized command and config semantics to keep MCP and skill behavior aligned with the CLI.
