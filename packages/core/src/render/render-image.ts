import sharp from "sharp";
import type { MediaMetadata } from "../contracts/render-result.js";
import type { RenderRequest } from "../contracts/render-request.js";
import type { Rect } from "../contracts/primitives.js";
import { buildOverlaySvg } from "../overlay/build-overlay-svg.js";
import { defaultCanvasSize, containSize, alignedRect } from "../scene/geometry.js";
import { createBackground } from "./background.js";
import { writeAtomic } from "../io/write-output.js";

function shadowSvg(rect: Rect, request: RenderRequest, width: number, height: number): Buffer {
  const shadow = request.container.shadow;
  const radius = request.container.radius;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><filter id="s" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${shadow.offsetX}" dy="${shadow.offsetY}" stdDeviation="${shadow.blur / 3}" flood-color="${shadow.color}" flood-opacity="${shadow.opacity}"/></filter><rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${radius}" fill="#000" filter="url(#s)"/></svg>`);
}

async function prepareSource(path: string, request: RenderRequest): Promise<{ buffer: Buffer; width: number; height: number }> {
  let source = sharp(path, { animated: false });
  if (request.crop) {
    source = source.extract({
      left: Math.round(request.crop.x),
      top: Math.round(request.crop.y),
      width: Math.round(request.crop.width),
      height: Math.round(request.crop.height)
    });
  }
  const metadata = await source.metadata();
  const width = metadata.width ?? request.crop?.width ?? 1;
  const height = metadata.height ?? request.crop?.height ?? 1;
  return { buffer: await source.png().toBuffer(), width, height };
}

async function roundedInput(buffer: Buffer, width: number, height: number, radius: number): Promise<Buffer> {
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`);
  const exact = await sharp(buffer).resize(width, height, { fit: "fill" }).png().toBuffer();
  return sharp(exact).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

function encodeOutput(image: sharp.Sharp, request: RenderRequest): sharp.Sharp {
  const format = request.output.format;
  const quality = request.output.quality;
  if (format === "jpeg") return image.jpeg({ quality });
  if (format === "webp") return image.webp({ quality });
  if (format === "avif") return image.avif({ quality });
  if (format === "tiff") return image.tiff({ quality });
  return image.png();
}

export async function renderImageToBuffer(inputPath: string, metadata: MediaMetadata, request: RenderRequest): Promise<{ buffer: Buffer; media: MediaMetadata }> {
  const source = await prepareSource(inputPath, request);
  const canvas = defaultCanvasSize(
    { width: source.width, height: source.height },
    request.container.padding,
    { width: request.output.width, height: request.output.height }
  );
  const contained = containSize(source, {
    width: Math.max(1, canvas.width - request.container.padding * 2),
    height: Math.max(1, canvas.height - request.container.padding * 2)
  });
  const rect = alignedRect(contained, canvas, request.container.padding, request.container.alignment);
  const resized = await sharp(source.buffer).resize(rect.width, rect.height, { fit: "fill" }).png().toBuffer();
  const rounded = await roundedInput(resized, rect.width, rect.height, request.container.radius);
  const background = await createBackground(request.background, canvas.width, canvas.height);
  const shadowLayer = await sharp(shadowSvg(rect, request, canvas.width, canvas.height))
    .resize(canvas.width, canvas.height, { fit: "fill" })
    .png()
    .toBuffer();
  const dim = request.backgroundOverlayOpacity > 0
    ? [{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"><rect width="100%" height="100%" fill="#000" opacity="${request.backgroundOverlayOpacity}"/></svg>`), left: 0, top: 0 }]
    : [];
  const overlay = await sharp(buildOverlaySvg(canvas.width, canvas.height, request.annotations, rect, request.spotlight))
    .resize(canvas.width, canvas.height, { fit: "fill" })
    .png()
    .toBuffer();
  const image = sharp(background).composite([
    ...dim,
    { input: shadowLayer, left: 0, top: 0 },
    { input: rounded, left: rect.x, top: rect.y },
    { input: overlay, left: 0, top: 0 }
  ]);
  return {
    buffer: await encodeOutput(image, request).toBuffer(),
    media: { ...metadata, kind: "image", width: canvas.width, height: canvas.height, format: request.output.format ?? "png" }
  };
}

export async function renderImage(inputPath: string, metadata: MediaMetadata, request: RenderRequest) {
  const rendered = await renderImageToBuffer(inputPath, metadata, request);
  const outputPath = await writeAtomic(request.output.path, rendered.buffer, request.output.overwrite);
  return { ok: true as const, outputPath, media: rendered.media, warnings: [] };
}
