import { findTemplate } from "./templates.js";
import { DecorError } from "../errors.js";
import { RenderRequestSchema } from "../contracts/render-request.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeRecords(base: unknown, override: unknown): unknown {
  if (!isRecord(base) || !isRecord(override)) {
    return override === undefined ? base : override;
  }

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    merged[key] = mergeRecords(merged[key], value);
  }
  return merged;
}

export function normalizeRenderRequest(raw: unknown) {
  const initial = RenderRequestSchema.parse(raw);
  if (!initial.template) {
    return initial;
  }

  const template = findTemplate(initial.template);
  if (!template) {
    throw new DecorError("config_invalid", `Unknown template "${initial.template}".`, [
      "Run decor list-templates to inspect available templates."
    ]);
  }

  return RenderRequestSchema.parse(mergeRecords(template.defaults, raw));
}
