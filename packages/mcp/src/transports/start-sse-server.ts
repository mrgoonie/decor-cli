import { createServer } from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createDecorMcpServer } from "../server.js";
import { authorizeHttp } from "../auth/http-auth.js";
import type { HttpServerOptions } from "./start-http-server.js";

export async function startSseServer(options: HttpServerOptions): Promise<void> {
  const sessions = new Map<string, SSEServerTransport>();
  const httpServer = createServer(async (req, res) => {
    if (!authorizeHttp(req, res, options)) return;
    if (req.method === "GET" && req.url === "/sse") {
      const server = createDecorMcpServer();
      const transport = new SSEServerTransport("/messages", res, {
        allowedOrigins: options.allowedOrigins,
        enableDnsRebindingProtection: options.allowedOrigins.length > 0
      });
      sessions.set(transport.sessionId, transport);
      await server.connect(transport);
      return;
    }
    if (req.method === "POST" && req.url?.startsWith("/messages")) {
      const sessionId = new URL(req.url, "http://localhost").searchParams.get("sessionId");
      const transport = sessionId ? sessions.get(sessionId) : undefined;
      if (!transport) {
        res.writeHead(404);
        res.end();
        return;
      }
      await transport.handlePostMessage(req, res);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => httpServer.listen(options.port, options.host, resolve));
  process.stderr.write(`decor MCP SSE listening on http://${options.host}:${options.port}/sse\n`);
}
