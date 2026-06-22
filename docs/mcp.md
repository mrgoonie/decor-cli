# MCP

Run local stdio:

```bash
decor-mcp --transport stdio
```

Run Streamable HTTP:

```bash
DECOR_MCP_TOKEN=example-token decor-mcp --transport http --host 127.0.0.1 --port 8080
```

Network transports require bearer auth before request parsing. HTTP binds to `127.0.0.1` by default. Non-local bind requires `--host`.

Tools:

- `render_decor`: mutating render workflow.
- `preview_decor`: mutating preview workflow.
- `validate_decor`: read-only config validation.
- `list_templates`: read-only template discovery.
- `doctor`: read-only local dependency checks.
- `config_resolve`: read-only template/default resolution.

SSE is available only with `--transport sse` for compatibility.
