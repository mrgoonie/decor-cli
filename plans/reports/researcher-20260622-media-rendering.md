# Research Report: decor-cli TypeScript rendering architecture
Date: 2026-06-22

## Executive Summary
Best fit: a split renderer with `sharp` for image jobs and `ffmpeg` for video jobs, driven by one shared scene/config model in TypeScript.

Why: `sharp` is already a mature cross-platform image pipeline with SVG input, resize/crop/contain/cover, and compositing; `ffmpeg` gives the real video filtergraph needed for scale/pad/crop/overlay/drawtext without browser hacks. `commander` and `zod` are sufficient for CLI + config validation. Keep the model small, pure, and explicit.

## Recommendation, Ranked
1. `sharp` + `ffmpeg-static` + `commander` + `zod`
   - Best pragmatic fit for Win/Mac/Linux.
   - Real processing, no mock/render simulation.
   - Lowest moving parts for images, strong enough for video.
2. Same architecture, but system `ffmpeg` fallback if GPL/binary size is a hard constraint.
   - Lower packaging burden, higher user setup risk.

## Core Pipeline
1. Parse CLI args with `commander`.
2. Validate normalized input with `zod`.
3. Resolve input source:
   - local path, URL download, or base64 decode.
4. Probe media:
   - `sharp.metadata()` for images.
   - `ffprobe` for video dimensions/duration/rotation.
5. Build a single scene spec:
   - canvas size, background, padding, rounded container, shadow, annotations, arrows, spotlight, output settings.
6. Render path by media type:
   - Images: `sharp` composes source + generated SVG/vector layers, then encodes final output.
   - Video: `ffmpeg` scales/pads/crops source, overlays a rasterized SVG layer, then encodes output.
7. Write output to the configured location/format/quality.

## Architecture Notes
- Keep geometry math in one pure module: positions, padding, corner radius, shadow offsets, and 9-position alignment.
- Keep rendering adapters thin:
  - `sharp` adapter for image composition and SVG rasterization.
  - `ffmpeg` adapter for video filters and encode settings.
- Treat annotations as a scene graph, not imperative drawing calls.
- Default to no distortion:
  - use `contain` or `cover` semantics only.
  - make `fill` an explicit opt-in, or omit it entirely.

## Library Choices
| Library | Use | Fit | Risk |
|---|---|---:|---|
| `sharp` | image resize/composite/SVG rasterization | High | Node >= 20.9, font/SVG edge cases |
| `ffmpeg-static` | bundled video binary | High | GPL-3.0, package size, binary update lag |
| `commander` | CLI parsing/help/subcommands | High | Slightly verbose API, but stable |
| `zod` | runtime config validation + TS inference | High | Requires TS `strict`, schema upkeep |

## Why This Stack
- `sharp` supports compositing and text overlays, and its resize API directly models `cover`, `contain`, `inside`, and `outside`. It also ships prebuilt binaries for macOS, Linux, and Windows. See: https://sharp.pixelplumbing.com/api-composite/ , https://sharp.pixelplumbing.com/api-resize/ , https://sharp.pixelplumbing.com/install/
- `ffmpeg` filters cover overlay, scale, pad, crop, and drawtext, which is enough for a real video pipeline. See: https://ffmpeg.org/ffmpeg-filters.html
- `ffmpeg-static` gives static ffmpeg/ffprobe binaries for macOS, Linux, and Windows, reducing install friction. See: https://github.com/eugeneware/ffmpeg-static
- `commander` is a lightweight, explicit CLI framework. See: https://tj.github.io/commander.js/
- `zod` is stable, TS-first, and validated against TS 5.5+. See: https://zod.dev/

## Trade-offs
- `sharp` vs canvas/browser rendering:
  - `sharp` wins on deployability and performance.
  - canvas/browser stacks add native build pain and are weaker for CLI distribution.
- `ffmpeg-static` vs system ffmpeg:
  - static binary wins on user experience and determinism.
  - system ffmpeg wins on license/package size simplicity.
- SVG overlay vs per-frame custom filters:
  - SVG overlay is simpler and unifies image/video decoration.
  - per-frame filtergraphs are more flexible but much harder to maintain.

## Risks
- Font availability differs across OSes; text metrics can drift. Ship explicit fonts or require `fontfile` paths for important templates.
- `ffmpeg-static` is GPL-3.0; confirm this is acceptable before shipping.
- Video overlays that animate over time can force more complex filtergraphs or frame-by-frame rendering.
- Windows quoting/path handling is error-prone; use `spawn`/argv arrays, not shell strings.
- Large inputs can blow memory if decoded too early; keep URL/base64 normalization streaming or temp-file based.

## Test Strategy
- Unit tests:
  - scene geometry math
  - 9-position alignment
  - crop/contain/cover decisions
  - config validation
- Integration tests with real binaries:
  - tiny fixture images through `sharp`
  - tiny fixture videos through `ffmpeg`
  - assert dimensions, aspect ratio, alpha, and output format
- Regression checks:
  - pixel probes at anchor points
  - `ffprobe` metadata assertions for video duration/size
  - output hash/snapshot for known fixtures
- CI matrix:
  - macOS, Windows, Linux
  - Node version pinned to the minimum supported by sharp

## Concrete Recommendation
Ship phase 1 around a shared scene model plus two renderers:
- image renderer: `sharp`
- video renderer: `ffmpeg-static`
- validation: `zod`
- CLI: `commander`

That is the minimal architecture that still satisfies real image/video processing, cross-platform support, and the no-distortion requirement.

## Limitations
- I did not benchmark actual encode times on your fixture set.
- I did not inspect any existing source code because the worktree currently only contains the bootstrap plan.
- I did not validate license policy for bundling static ffmpeg in this repo.

## Sources
- Sharp composite docs: https://sharp.pixelplumbing.com/api-composite/
- Sharp resize docs: https://sharp.pixelplumbing.com/api-resize/
- Sharp install docs: https://sharp.pixelplumbing.com/install/
- FFmpeg filters docs: https://ffmpeg.org/ffmpeg-filters.html
- FFmpeg project home: https://www.ffmpeg.org/
- ffmpeg-static repo: https://github.com/eugeneware/ffmpeg-static
- Commander docs: https://tj.github.io/commander.js/
- Zod docs: https://zod.dev/

Status: DONE
