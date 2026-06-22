# System Architecture

`decor-cli` uses one shared core and two thin adapters.

```mermaid
flowchart LR
  CLI[CLI] --> Core[decor-cli-core]
  MCP[MCP] --> Core
  Core --> Input[Input resolver]
  Core --> Scene[Scene model]
  Core --> Image[Sharp renderer]
  Core --> Video[FFmpeg frame renderer]
```

Core owns schemas, template resolution, input safety, geometry, SVG overlays, and rendering. CLI and MCP translate user input into core requests and format results.
