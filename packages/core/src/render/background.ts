import { readdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { Background } from "../contracts/background.js";
import { svgBuffer } from "../overlay/svg-utils.js";

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".tif", ".tiff"]);

function extension(path: string): string {
  const index = path.lastIndexOf(".");
  return index >= 0 ? path.slice(index).toLowerCase() : "";
}

async function pickBackgroundPath(background: Extract<Background, { type: "image" }>): Promise<string | undefined> {
  if (background.path) return background.path;
  if (!background.folder) return undefined;
  const files = (await readdir(background.folder)).filter((file) => imageExtensions.has(extension(file)));
  if (files.length === 0) return undefined;
  const selected = files[Math.floor(Math.random() * files.length)];
  return join(background.folder, selected);
}

async function withOpacity(input: Buffer, opacity: number): Promise<Buffer> {
  if (opacity >= 1) return input;
  const image = sharp(input).ensureAlpha();
  const metadata = await image.metadata();
  const raw = await image.raw().toBuffer();
  for (let index = 3; index < raw.length; index += 4) {
    raw[index] = Math.round(raw[index] * opacity);
  }
  return sharp(raw, {
    raw: {
      width: metadata.width ?? 1,
      height: metadata.height ?? 1,
      channels: 4
    }
  }).png().toBuffer();
}

export async function createBackground(background: Background, width: number, height: number): Promise<Buffer> {
  if (background.type === "solid") {
    return sharp({ create: { width, height, channels: 4, background: background.color } }).png().toBuffer();
  }
  if (background.type === "gradient") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" gradientTransform="rotate(${background.angle})"><stop offset="0%" stop-color="${background.from}"/><stop offset="100%" stop-color="${background.to}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
    return sharp(svgBuffer(svg)).png().toBuffer();
  }
  const path = await pickBackgroundPath(background);
  if (!path) {
    return sharp({ create: { width, height, channels: 4, background: "#111827" } }).png().toBuffer();
  }
  let pipeline = sharp(path).resize(width, height, { fit: "cover" });
  if (background.blur > 0) {
    pipeline = pipeline.blur(background.blur);
  }
  const image = await pipeline.png().toBuffer();
  if (background.opacity >= 1) {
    return image;
  }
  return sharp({ create: { width, height, channels: 4, background: "#00000000" } })
    .composite([{ input: await withOpacity(image, background.opacity), blend: "over" }])
    .png()
    .toBuffer();
}
