import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { RenderRequest } from "../contracts/render-request.js";
import { normalizeRenderRequest } from "./merge-render-request.js";

export async function readJsonConfig(path: string): Promise<unknown> {
  const raw = await readFile(resolve(path), "utf8");
  return JSON.parse(raw) as unknown;
}

export async function loadRenderRequestFromConfig(path: string): Promise<RenderRequest> {
  return normalizeRenderRequest(await readJsonConfig(path));
}

export { normalizeRenderRequest };
