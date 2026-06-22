#!/usr/bin/env node
import { startStdioServer } from "../transports/start-stdio-server.js";
import { startHttpServer } from "../transports/start-http-server.js";
import { startSseServer } from "../transports/start-sse-server.js";

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const transport = arg("--transport", process.env.MCP_TRANSPORT ?? "stdio");
const host = arg("--host", process.env.HOST ?? "127.0.0.1") ?? "127.0.0.1";
const port = Number(arg("--port", process.env.PORT ?? "8080"));
const token = arg("--token", process.env.DECOR_MCP_TOKEN);
const origins = (arg("--allowed-origins", process.env.DECOR_MCP_ALLOWED_ORIGINS ?? "") ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const maxBodyBytes = Number(arg("--max-body-bytes", process.env.DECOR_MCP_MAX_BODY_BYTES ?? "1048576"));

if (transport === "stdio") {
  await startStdioServer();
} else if (transport === "http") {
  await startHttpServer({ host, port, token, allowedOrigins: origins, maxBodyBytes });
} else if (transport === "sse") {
  await startSseServer({ host, port, token, allowedOrigins: origins, maxBodyBytes });
} else {
  process.stderr.write(`Unknown transport: ${transport}\n`);
  process.exit(1);
}
