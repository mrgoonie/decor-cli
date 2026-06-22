import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { resolveFfmpegBinaries, runProcess } from "../src/ffmpeg/ffmpeg-binaries.js";
import { runRenderJob } from "../src/render/run-render-job.js";
import { probeMedia } from "../src/probe/probe-media.js";

describe("runRenderJob video", () => {
  it("renders a real video through the frame pipeline", async () => {
    const { ffmpegPath } = resolveFfmpegBinaries();
    const dir = await mkdtemp(join(tmpdir(), "decor-video-"));
    try {
      const input = join(dir, "input.mp4");
      const output = join(dir, "output.mp4");
      await runProcess(ffmpegPath, [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=#1f2937:s=96x54:d=0.4:r=2",
        "-pix_fmt",
        "yuv420p",
        input
      ]);
      const result = await runRenderJob({
        input: { type: "path", path: input },
        output: { path: output, format: "mp4", overwrite: true },
        container: { padding: 12, radius: 8, alignment: "center" },
        background: { type: "solid", color: "#111827" }
      });
      expect(result.media.kind).toBe("video");
      const metadata = await probeMedia(output, {
        allowPrivateNetwork: false,
        maxInputBytes: 10 * 1024 * 1024,
        maxPixels: 10_000_000,
        maxVideoDurationSeconds: 5,
        requestTimeoutMs: 1000,
        maxRedirects: 0,
        keepTemp: false
      });
      expect(metadata.kind).toBe("video");
      expect(metadata.width).toBe(120);
      expect(metadata.height).toBe(78);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
