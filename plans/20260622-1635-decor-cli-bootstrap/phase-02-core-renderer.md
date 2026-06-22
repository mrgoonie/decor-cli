---
phase: 2
title: "Core renderer"
status: completed
priority: P1
effort: 2.5d
dependencies: [1]
---

# Phase 02: Core renderer

## Context links
- `plans/reports/researcher-20260622-media-rendering.md:17-40`
- `plans/reports/researcher-20260622-media-rendering.md:42-73`
- `plans/reports/researcher-20260622-media-rendering.md:75-100`
- `plans/reports/agentize-decisions-decor-cli.md`

## Overview
Implement the real rendering engine inside `packages/core`: input normalization, media probing, scene modeling, overlay generation, image rendering, video rendering, and structured results. This phase is the behavior source of truth for both CLI and MCP.

## Key insights
- One scene graph must drive both image and video jobs so annotations, spotlight, padding, and alignment behave the same everywhere.
- `sharp` is the pragmatic image engine; system `ffmpeg` plus `ffprobe` is the pragmatic video engine for v1 to avoid bundling GPL static binaries.
- Memory spikes and temp-file leaks are the main operational failure modes for URL and base64 inputs.
- URL and base64 inputs are security-sensitive because MCP HTTP can turn them into authenticated SSRF or resource exhaustion if the core accepts hostile sources.

## Requirements
- Functional: support local file, URL, and base64 inputs; detect image versus video; probe dimensions and duration; normalize into one `render-request`.
- Functional: enforce the input-source security contract: `http`/`https` only, redirect revalidation, private/loopback/link-local/multicast/metadata IP denylist by default, timeout, max redirects, `Content-Length` precheck, streaming byte cap, MIME/media sniffing, max dimensions, max duration, malformed base64 rejection, and decoded base64 cap.
- Functional: support built-in scene features required by v1: background, padding, rounded container, shadow, annotations, shapes, arrows, spotlight, and output quality/format settings.
- Functional: render images with `sharp` and videos with `ffmpeg`, both from the same scene spec and overlay asset pipeline.
- Functional: return structured `render-result` data with output path, media metadata, warnings, and stable error codes.
- Non-functional: no fake rendering; all integration tests must execute real `sharp` and real system `ffmpeg` binaries; temp artifacts must be cleaned on success and failure.
- Non-functional: temp/output handling uses per-job `mkdtemp`, random filenames, `finally` cleanup, best-effort signal cleanup, atomic writes, explicit overwrite opt-in, symlink guards, and path traversal protection.

## Architecture
Data flow:
1. `resolve-input-source` converts path, URL, or base64 into a normalized local asset handle after applying security limits.
2. `probe-media` uses `sharp.metadata()` for images or `ffprobe` for video.
3. `build-scene-spec` merges request, template defaults, and geometry helpers into one scene graph.
4. `build-overlay-svg` emits a deterministic overlay asset for annotations and spotlight.
5. `render-image` composites the source and overlay through `sharp`.
6. `render-video` scales and pads the source, rasterizes overlays, and runs the `ffmpeg` filtergraph.
7. `write-render-result` returns output metadata, warnings, and cleanup details to the caller.

## Related code files
- Own: `packages/core/**`.
- Create: `packages/core/src/contracts/*.ts`, `packages/core/src/input/resolve-input-source.ts`, `packages/core/src/probe/probe-media.ts`, `packages/core/src/scene/build-scene-spec.ts`, `packages/core/src/scene/geometry.ts`, `packages/core/src/overlay/build-overlay-svg.ts`, `packages/core/src/render/render-image.ts`, `packages/core/src/render/render-video.ts`, `packages/core/src/render/run-render-job.ts`, `packages/core/src/errors/*.ts`, `packages/core/test/**`.
- Modify: `packages/core/src/index.ts`, workspace scripts or package manifest only if phase-01 exports need extension.
- Delete: none.

## Implementation steps
1. Define strict `zod` schemas and TypeScript types for input sources, scene config, templates, outputs, and error envelopes.
2. Implement input resolvers for local path, URL download, and base64 decode with URL network deny rules, byte/time limits, media sniffing, and temp-file cleanup hooks.
3. Implement image and video probing with one normalized metadata shape.
4. Implement geometry helpers for alignment, padding, contain/cover decisions, rounded bounds, and spotlight math.
5. Implement overlay generation for annotations, basic shapes, arrows, and spotlight using deterministic SVG output.
6. Implement `sharp` image rendering and system `ffmpeg` video rendering behind one `runRenderJob` entry point.
7. Add real integration tests with tiny fixture images and videos plus golden metadata assertions.
8. Add hostile-input tests for localhost/private/link-local URLs, redirects to denied addresses, missing or lying content lengths, malformed/oversized base64, decompression/dimension/duration limits, output overwrite, symlink/path traversal, concurrent renders, and cleanup after failed probes.

## Todo list
- [ ] Input resolvers support path, URL, and base64.
- [ ] URL/base64 security limits and hostile-source tests are implemented.
- [ ] Probers normalize image and video metadata.
- [ ] Scene graph covers annotations, shapes, arrows, and spotlight.
- [ ] `sharp` image renderer works against real fixtures.
- [ ] `ffmpeg` video renderer works against real fixtures.
- [ ] Structured errors and warnings are stable enough for adapters.

## Success criteria
- [ ] One core API renders a real decorated image fixture and a real decorated video fixture.
- [ ] URL and base64 flows complete without leaving temp files behind, including failure paths.
- [ ] Output writes are atomic and refuse implicit overwrite, symlink clobbering, and path traversal.
- [ ] Unit tests cover geometry, schema validation, and contain/cover decisions.
- [ ] Integration tests assert output dimensions, media type, and key metadata with real binaries.

## Risk assessment
- Medium x High: system `ffmpeg` missing on user machines. Mitigation: explicit env overrides, `doctor` checks, actionable install guidance, and CI coverage on all target OSes.
- Medium x High: remote or base64 inputs trigger SSRF or exhaust memory. Mitigation: network denylist, redirect revalidation, byte/time/probe limits, stream to disk, cap payload size, and test cleanup on failures.
- Medium x Medium: font and SVG rendering drift across platforms. Mitigation: bundle deterministic fixtures and test pixel anchors instead of full-frame equality only.

## Security considerations
- Restrict URL fetching to explicit protocols; deny private/loopback/link-local/multicast/metadata IPs; revalidate redirects; fail closed on unsupported schemes and suspicious media probes.
- Redact file paths and source strings in user-facing errors where they may contain tokens.
- Never shell-interpolate `ffmpeg` arguments; pass argv arrays only.
- Never follow symlinks for output clobbering; write atomically and only overwrite when explicitly requested.

## Rollback
- Revert `packages/core/**` without touching CLI or MCP adapters.
- Preserve fixture assets and tests if they still describe desired behavior.

## Next steps
Phase 03 and phase 04 start only after `packages/core` exposes stable render contracts and test fixtures.
