import { spawn } from "node:child_process";
import sharp from "sharp";
import type { MediaMetadata } from "../contracts/render-result.js";
import type { RenderOptions } from "../contracts/render-request.js";
import { DecorError } from "../errors.js";
import { resolveFfmpegBinaries } from "../ffmpeg/ffmpeg-binaries.js";

function runFfprobe(path: string): Promise<Record<string, unknown>> {
  const { ffprobePath } = resolveFfmpegBinaries();
  return new Promise((resolve, reject) => {
    const args = ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", path];
    const child = spawn(ffprobePath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new DecorError("media_probe_failed", `ffprobe failed: ${stderr.slice(0, 500)}`));
        return;
      }
      resolve(JSON.parse(stdout) as Record<string, unknown>);
    });
  });
}

function parseFraction(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const [left, right] = value.split("/").map(Number);
  if (!right) return left;
  return left / right;
}

export async function probeMedia(path: string, options: RenderOptions): Promise<MediaMetadata> {
  try {
    const metadata = await sharp(path, { animated: true }).metadata();
    if (metadata.width && metadata.height) {
      const pixels = metadata.width * metadata.height;
      if (pixels > options.maxPixels) {
        throw new DecorError("input_too_large", "Image dimensions exceed the configured pixel limit.");
      }
      return { kind: "image", width: metadata.width, height: metadata.height, format: metadata.format };
    }
  } catch (error) {
    if (error instanceof DecorError) throw error;
  }

  const probed = await runFfprobe(path);
  const streams = Array.isArray(probed.streams) ? probed.streams : [];
  const video = streams.find((stream) => typeof stream === "object" && stream && (stream as { codec_type?: string }).codec_type === "video");
  if (!video || typeof video !== "object") {
    throw new DecorError("media_probe_failed", "Input is not a supported image or video.");
  }
  const v = video as { width?: number; height?: number; duration?: string; avg_frame_rate?: string };
  const format = probed.format as { duration?: string; format_name?: string } | undefined;
  const duration = Number(v.duration ?? format?.duration ?? 0);
  if (duration > options.maxVideoDurationSeconds) {
    throw new DecorError("input_too_large", "Video duration exceeds the configured limit.");
  }
  if (!v.width || !v.height || v.width * v.height > options.maxPixels) {
    throw new DecorError("input_too_large", "Video dimensions exceed the configured pixel limit.");
  }
  return {
    kind: "video",
    width: v.width,
    height: v.height,
    durationSeconds: duration || undefined,
    format: format?.format_name ?? "video"
  };
}

export async function getVideoFrameRate(path: string): Promise<number> {
  const probed = await runFfprobe(path);
  const streams = Array.isArray(probed.streams) ? probed.streams : [];
  const video = streams.find((stream) => typeof stream === "object" && stream && (stream as { codec_type?: string }).codec_type === "video");
  const rate = parseFraction((video as { avg_frame_rate?: string } | undefined)?.avg_frame_rate);
  return rate && Number.isFinite(rate) && rate > 0 ? Math.min(rate, 60) : 30;
}
