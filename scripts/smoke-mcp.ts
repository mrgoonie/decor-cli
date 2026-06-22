import { createDecorMcpServer } from "decor-cli-mcp";

const server = createDecorMcpServer();
await server.close();
console.log(JSON.stringify({ ok: true, server: "decor-cli-mcp" }));
