import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { runRenderJob } from "../src/render/run-render-job.js";

async function tempDir() {
  return mkdtemp(join(tmpdir(), "decor-test-"));
}

describe("runRenderJob image", () => {
  it("renders a decorated image with annotations", async () => {
    const dir = await tempDir();
    try {
      const input = join(dir, "input.png");
      const output = join(dir, "output.png");
      await sharp({ create: { width: 320, height: 180, channels: 4, background: "#1f2937" } }).png().toFile(input);
      const result = await runRenderJob({
        input: { type: "path", path: input },
        output: { path: output, overwrite: true },
        template: "clean-gradient",
        annotations: [
          { type: "text", text: "Hello", x: 40, y: 64, color: "#ffffff", shadow: true },
          { type: "text", text: "Outlined note", x: 40, y: 120, width: 120, outlineColor: "#111827", outlineWidth: 2, backgroundColor: "#000000" },
          { type: "counter", value: 1, x: 90, y: 110, size: 38 },
          { type: "arrow", from: { x: 220, y: 80 }, to: { x: 275, y: 120 }, color: "#fde047", width: 4, curve: 0.2 },
          { type: "rect", x: 170, y: 42, width: 80, height: 48, stroke: "#fb923c", fill: "#fb923c", fillOpacity: 0.2, cornerRadius: 10 },
          { type: "circle", x: 265, y: 75, radius: 18, stroke: "#22c55e", strokeWidth: 2 },
          { type: "line", x: 42, y: 145, x2: 130, y2: 145, stroke: "#38bdf8", strokeWidth: 3 }
        ],
        spotlight: { region: { x: 24, y: 24, width: 120, height: 80 }, opacity: 0.48, radius: 8 }
      });
      expect(result.outputPath).toBe(output);
      const metadata = await sharp(output).metadata();
      expect(metadata.width).toBe(512);
      expect(metadata.height).toBe(372);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
