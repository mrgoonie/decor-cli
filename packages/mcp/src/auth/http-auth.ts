import type { IncomingMessage, ServerResponse } from "node:http";

export interface HttpAuthOptions {
  token?: string;
  allowedOrigins: string[];
  maxBodyBytes: number;
}

export function reject(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: { code: "unauthorized", message } }));
}

export function authorizeHttp(req: IncomingMessage, res: ServerResponse, options: HttpAuthOptions): boolean {
  const expected = options.token ?? process.env.DECOR_MCP_TOKEN;
  if (!expected) {
    reject(res, 401, "DECOR_MCP_TOKEN or --token is required for network transports.");
    return false;
  }
  const actual = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (actual !== expected) {
    reject(res, 401, "Invalid bearer token.");
    return false;
  }
  const hasBody = ["POST", "PUT", "PATCH"].includes(req.method ?? "");
  const contentLength = req.headers["content-length"];
  if (hasBody && contentLength === undefined) {
    reject(res, 411, "Content-Length is required for MCP request bodies.");
    return false;
  }
  const length = Number(contentLength ?? 0);
  if (!Number.isFinite(length) || length < 0) {
    reject(res, 400, "Content-Length is invalid.");
    return false;
  }
  if (length > options.maxBodyBytes) {
    reject(res, 413, "Request body exceeds the configured MCP limit.");
    return false;
  }
  const origin = req.headers.origin;
  if (origin && !options.allowedOrigins.includes(origin)) {
    reject(res, 403, "Origin is not allowed.");
    return false;
  }
  return true;
}
