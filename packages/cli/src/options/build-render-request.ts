import { readFile } from "node:fs/promises";
import { RenderRequestSchema, type RenderRequest } from "decor-cli-core";

interface RenderCliOptions {
  input?: string;
  inputUrl?: string;
  inputBase64?: string;
  output?: string;
  config?: string;
  template?: string;
  background?: string;
  backgroundFolder?: string;
  gradient?: string;
  backgroundOpacity?: string;
  padding?: string;
  radius?: string;
  shadowOpacity?: string;
  shadowBlur?: string;
  alignment?: string;
  crop?: string;
  text?: string;
  textPosition?: string;
  quality?: string;
  overwrite?: boolean;
  allowPrivateNetwork?: boolean;
  jsonOptions?: string;
}

function parseNumber(value: string | undefined, fallback: number): number {
  return value === undefined ? fallback : Number(value);
}

function parseCrop(value: string | undefined) {
  if (!value) return undefined;
  const [x, y, width, height] = value.split(",").map(Number);
  return { x, y, width, height };
}

function parseText(options: RenderCliOptions): Array<Record<string, unknown>> {
  if (!options.text) return [];
  const [x, y] = (options.textPosition ?? "48,64").split(",").map(Number);
  return [{ type: "text", text: options.text, x, y, fontSize: 42, color: "#ffffff", shadow: true }];
}

async function readConfig(path: string | undefined): Promise<Record<string, unknown>> {
  if (!path) return {};
  return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
}

function inputFromOptions(options: RenderCliOptions) {
  if (options.inputUrl) return { type: "url" as const, url: options.inputUrl };
  if (options.inputBase64) return { type: "base64" as const, data: options.inputBase64 };
  if (options.input) return { type: "path" as const, path: options.input };
  throw new Error("Provide --input, --input-url, or --input-base64.");
}

function backgroundFromOptions(options: RenderCliOptions) {
  if (options.backgroundFolder) return { type: "image" as const, folder: options.backgroundFolder, opacity: parseNumber(options.backgroundOpacity, 1), blur: 0 };
  if (options.background) return { type: "image" as const, path: options.background, opacity: parseNumber(options.backgroundOpacity, 1), blur: 0 };
  if (options.gradient) {
    const [from, to, angle] = options.gradient.split(",");
    return { type: "gradient" as const, from, to, angle: angle ? Number(angle) : 135 };
  }
  return undefined;
}

export async function buildRenderRequest(options: RenderCliOptions, preview = false): Promise<RenderRequest> {
  const config = await readConfig(options.config);
  const jsonOptions = options.jsonOptions ? JSON.parse(options.jsonOptions) as Record<string, unknown> : {};
  const request = {
    ...config,
    ...jsonOptions,
    input: inputFromOptions(options),
    output: {
      path: options.output ?? (preview ? "decor-preview.png" : "decor-output.png"),
      quality: parseNumber(options.quality, 92),
      overwrite: Boolean(options.overwrite),
      ...(jsonOptions.output as object | undefined)
    },
    template: options.template ?? (config.template as string | undefined),
    background: backgroundFromOptions(options) ?? config.background,
    container: {
      ...((config.container as object | undefined) ?? {}),
      padding: parseNumber(options.padding, Number((config.container as { padding?: number } | undefined)?.padding ?? 96)),
      radius: parseNumber(options.radius, Number((config.container as { radius?: number } | undefined)?.radius ?? 36)),
      alignment: options.alignment ?? (config.container as { alignment?: string } | undefined)?.alignment ?? "center",
      shadow: {
        opacity: parseNumber(options.shadowOpacity, 0.35),
        blur: parseNumber(options.shadowBlur, 36),
        offsetX: 0,
        offsetY: 18,
        color: "#000000"
      }
    },
    crop: parseCrop(options.crop) ?? config.crop,
    annotations: [...((config.annotations as Array<Record<string, unknown>> | undefined) ?? []), ...parseText(options)],
    options: {
      ...((config.options as object | undefined) ?? {}),
      allowPrivateNetwork: Boolean(options.allowPrivateNetwork)
    }
  };
  return RenderRequestSchema.parse(request);
}
