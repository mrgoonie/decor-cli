import { readdir, mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MediaMetadata } from "../contracts/render-result.js";
import type { RenderRequest } from "../contracts/render-request.js";
import { resolveFfmpegBinaries, runProcess } from "../ffmpeg/ffmpeg-binaries.js";
import { getVideoFrameRate } from "../probe/probe-media.js";
import { publishAtomicOutput, reserveAtomicOutput } from "../io/write-output.js";
import { renderImageToBuffer } from "./render-image.js";

export async function renderVideo(inputPath: string, metadata: MediaMetadata, request: RenderRequest, tempDir: string) {
  const { ffmpegPath } = resolveFfmpegBinaries();
  const framesDir = join(tempDir, "frames");
  const renderedDir = join(tempDir, "rendered");
  await mkdir(framesDir);
  await mkdir(renderedDir);
  const reserved = await reserveAtomicOutput(request.output.path, request.output.overwrite);
  const fps = await getVideoFrameRate(inputPath);
  await runProcess(ffmpegPath, ["-y", "-i", inputPath, "-vsync", "0", join(framesDir, "frame-%06d.png")]);
  const frames = (await readdir(framesDir)).filter((file) => file.endsWith(".png")).sort();
  let renderedMedia: MediaMetadata | undefined;
  for (const frame of frames) {
    const framePath = join(framesDir, frame);
    const rendered = await renderImageToBuffer(framePath, { kind: "image", width: metadata.width, height: metadata.height }, request);
    renderedMedia = rendered.media;
    await writeFile(join(renderedDir, frame), rendered.buffer);
  }
  const videoCodec = request.output.format === "webm" ? "libvpx-vp9" : "libx264";
  try {
    await runProcess(ffmpegPath, [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      join(renderedDir, "frame-%06d.png"),
      "-i",
      inputPath,
      "-map",
      "0:v",
      "-map",
      "1:a?",
      "-c:v",
      videoCodec,
      "-pix_fmt",
      "yuv420p",
      "-shortest",
      reserved.tempPath
    ]);
    await publishAtomicOutput(reserved.tempPath, reserved.outputPath, request.output.overwrite);
  } catch (error) {
    await unlink(reserved.tempPath).catch(() => undefined);
    throw error;
  }
  return {
    ok: true as const,
    outputPath: reserved.outputPath,
    media: { ...metadata, width: renderedMedia?.width ?? metadata.width, height: renderedMedia?.height ?? metadata.height, format: request.output.format ?? metadata.format },
    warnings: frames.length === 0 ? ["No frames were extracted from the video."] : []
  };
}
