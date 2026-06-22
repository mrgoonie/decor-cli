import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createDecorMcpServer } from "../server.js";
import { authorizeHttp } from "../auth/http-auth.js";

export interface HttpServerOptions {
  host: string;
  port: number;
  token?: string;
  allowedOrigins: string[];
  maxBodyBytes: number;
}

export async function startHttpServer(options: HttpServerOptions): Promise<void> {
  const httpServer = createServer(async (req, res) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (req.url !== "/mcp") {
      res.writeHead(404);
      res.end();
      return;
    }
    if (!authorizeHttp(req, res, options)) {
      return;
    }
    const server = createDecorMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
    await server.connect(transport);
    await transport.handleRequest(req, res);
  });
  await new Promise<void>((resolve) => httpServer.listen(options.port, options.host, resolve));
  process.stderr.write(`decor MCP HTTP listening on http://${options.host}:${options.port}/mcp\n`);
}
