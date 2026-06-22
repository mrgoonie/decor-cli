---
name: decor-cli
description: "Use decor-cli to decorate screenshots, images, and videos with backgrounds, gradients, templates, annotations, arrows, shapes, counters, and spotlight effects from CLI or MCP."
category: media
keywords: [decor-cli, screenshot, image, video, background, annotations, mcp]
---

# decor-cli

Use this skill when an agent needs to create polished visual output from an input image or video.

## Workflows

### Render a Screenshot

```bash
decor render --input screenshot.png --output output.png --template clean-gradient --overwrite
```

### Add Text or Annotation

```bash
decor render --input screenshot.png --output output.png --text "Step 1" --text-position 80,90 --overwrite
```

### Use MCP

Local:

```bash
decor-mcp --transport stdio
```

Remote development:

```bash
DECOR_MCP_TOKEN=example-token decor-mcp --transport http --host 127.0.0.1 --port 8080
```

Tools: `render_decor`, `preview_decor`, `validate_decor`, `list_templates`, `doctor`, `config_resolve`.

## Notes

- Install system `ffmpeg` and `ffprobe` for video rendering.
- URL inputs block private networks by default.
- Prefer JSON config for complex text, arrows, shapes, counters, and spotlight.
