import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { runRenderJob } from "decor-cli-core";

const dir = await mkdtemp(join(tmpdir(), "decor-smoke-"));
try {
  const input = join(dir, "input.png");
  const output = join(dir, "output.png");
  await sharp({ create: { width: 240, height: 160, channels: 4, background: "#202938" } }).png().toFile(input);
  const result = await runRenderJob({
    input: { type: "path", path: input },
    output: { path: output, overwrite: true },
    template: "dark-focus",
    annotations: [{ type: "arrow", from: { x: 40, y: 40 }, to: { x: 180, y: 120 }, color: "#f8fafc" }]
  });
  console.log(JSON.stringify({ ok: true, outputPath: result.outputPath, media: result.media }, null, 2));
} finally {
  await rm(dir, { recursive: true, force: true });
}
