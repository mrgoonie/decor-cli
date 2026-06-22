import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { doctorFfmpeg, listTemplates, normalizeRenderRequest, RenderRequestSchema, runRenderJob, toErrorResponse } from "decor-cli-core";

function structured(data: unknown): Record<string, unknown> {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return { value: data };
}

function textResponse(summary: string, data: unknown) {
  return {
    content: [{ type: "text" as const, text: summary }],
    structuredContent: structured(data)
  };
}

async function safeCall<T>(fn: () => Promise<T> | T) {
  try {
    return await fn();
  } catch (error) {
    const response = toErrorResponse(error);
    return textResponse(response.error.message, response);
  }
}

export function registerDecorTools(server: McpServer): void {
  server.registerTool("render_decor", {
    title: "Render decorated media",
    description: "Mutating tool. Render an image or video to the requested output path using decor-cli templates, backgrounds, annotations, spotlight, and output settings. Fails with actionable errors for unsafe URLs, missing ffmpeg, invalid config, or blocked output paths.",
    inputSchema: RenderRequestSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
  }, async (args) => safeCall(async () => {
    const result = await runRenderJob(args);
    return textResponse(`Rendered ${result.media.kind} to ${result.outputPath}`, { ok: true, data: result });
  }));

  server.registerTool("preview_decor", {
    title: "Preview decorated media",
    description: "Mutating local preview tool. Uses the same render pipeline as render_decor, typically with a temporary or preview output path.",
    inputSchema: RenderRequestSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
  }, async (args) => safeCall(async () => {
    const request = normalizeRenderRequest(args);
    const result = await runRenderJob(request);
    return textResponse(`Preview rendered to ${result.outputPath}`, { ok: true, data: result });
  }));

  server.registerTool("validate_decor", {
    title: "Validate decor config",
    description: "Read-only tool. Validate a decor render request without writing output.",
    inputSchema: RenderRequestSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
  }, async (args) => safeCall(() => textResponse("Decor request is valid.", { ok: true, data: normalizeRenderRequest(args) })));

  server.registerTool("list_templates", {
    title: "List templates",
    description: "Read-only tool. List built-in decor templates with concise descriptions and demo hints.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
  }, async () => textResponse("Available decor templates.", { ok: true, data: listTemplates() }));

  server.registerTool("doctor", {
    title: "Doctor",
    description: "Read-only tool. Check local rendering dependencies such as ffmpeg and ffprobe without revealing secrets.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
  }, async () => textResponse("decor-cli doctor result.", { ok: true, data: doctorFfmpeg() }));

  server.registerTool("config_resolve", {
    title: "Resolve config",
    description: "Read-only tool. Resolve a request through templates and defaults to show the final render configuration.",
    inputSchema: RenderRequestSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
  }, async (args) => safeCall(() => textResponse("Resolved decor request.", { ok: true, data: normalizeRenderRequest(args) })));
}
