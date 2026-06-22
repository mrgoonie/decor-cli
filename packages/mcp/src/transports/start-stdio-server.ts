import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createDecorMcpServer } from "../server.js";

export async function startStdioServer(): Promise<void> {
  const server = createDecorMcpServer();
  await server.connect(new StdioServerTransport());
}
