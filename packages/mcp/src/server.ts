import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDecorTools } from "./tools/register-tools.js";

export function createDecorMcpServer(): McpServer {
  const server = new McpServer({
    name: "decor-cli-mcp",
    version: "0.1.0"
  });
  registerDecorTools(server);
  return server;
}
