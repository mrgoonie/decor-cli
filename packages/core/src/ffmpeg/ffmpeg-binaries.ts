import { spawn, spawnSync } from "node:child_process";
import type { DoctorResult } from "../contracts/render-result.js";
import { DecorError } from "../errors.js";

export interface FfmpegBinaries {
  ffmpegPath: string;
  ffprobePath: string;
}

function canRun(command: string): boolean {
  const result = spawnSync(command, ["-version"], { stdio: "ignore" });
  return result.status === 0;
}

function resolveBinary(envName: string, fallback: string): { command: string; source: string; ok: boolean } {
  const explicit = process.env[envName];
  if (explicit) {
    return { command: explicit, source: envName, ok: canRun(explicit) };
  }
  return { command: fallback, source: "PATH", ok: canRun(fallback) };
}

export function resolveFfmpegBinaries(): FfmpegBinaries {
  const ffmpeg = resolveBinary("DECOR_FFMPEG_PATH", "ffmpeg");
  const ffprobe = resolveBinary("DECOR_FFPROBE_PATH", "ffprobe");
  if (!ffmpeg.ok || !ffprobe.ok) {
    throw new DecorError("ffmpeg_missing", "ffmpeg and ffprobe are required for video rendering.", [
      "Install ffmpeg for your OS, or set DECOR_FFMPEG_PATH and DECOR_FFPROBE_PATH.",
      "Run decor doctor to see which binary is missing."
    ]);
  }
  return { ffmpegPath: ffmpeg.command, ffprobePath: ffprobe.command };
}

export function doctorFfmpeg(): DoctorResult {
  const ffmpeg = resolveBinary("DECOR_FFMPEG_PATH", "ffmpeg");
  const ffprobe = resolveBinary("DECOR_FFPROBE_PATH", "ffprobe");
  return {
    ok: ffmpeg.ok && ffprobe.ok,
    checks: [
      { name: "ffmpeg", ok: ffmpeg.ok, source: ffmpeg.source, message: ffmpeg.ok ? "ffmpeg is available." : "ffmpeg is missing." },
      { name: "ffprobe", ok: ffprobe.ok, source: ffprobe.source, message: ffprobe.ok ? "ffprobe is available." : "ffprobe is missing." }
    ]
  };
}

export function runProcess(command: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new DecorError("render_failed", `${command} exited with code ${code}: ${stderr.slice(0, 800)}`));
    });
  });
}
