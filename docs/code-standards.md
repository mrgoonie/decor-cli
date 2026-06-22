# Code Standards

- Keep core business logic in `packages/core`.
- Keep CLI and MCP adapters thin.
- Use TypeScript strict mode and zod schemas at boundaries.
- Use argv arrays for child processes.
- Do not print secrets or bearer tokens.
- Keep code files focused and under roughly 200 lines when practical.
