import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { createBackground } from "../src/render/background.js";
import { findTemplate, listTemplates } from "../src/config/templates.js";
import { normalizeRenderRequest } from "../src/config/merge-render-request.js";
import { loadRenderRequestFromConfig } from "../src/config/config-loader.js";

describe("templates and backgrounds", () => {
  it("lists and applies built-in templates", () => {
    expect(listTemplates().map((template) => template.name)).toContain("clean-gradient");
    expect(findTemplate("dark-focus")?.description).toMatch(/Deep/);
    const request = normalizeRenderRequest({
      template: "editorial-light",
      input: { type: "path", path: "in.png" },
      output: { path: "out.png" }
    });
    expect(request.background.type).toBe("solid");
    expect(request.container.radius).toBe(22);
  });

  it("loads config files through template defaults", async () => {
    const dir = await mkdtemp(join(tmpdir(), "decor-config-"));
    try {
      const config = join(dir, "decor.json");
      await writeFile(config, JSON.stringify({
        template: "editorial-light",
        input: { type: "path", path: "input.png" },
        output: { path: "output.png" },
        container: { radius: 8 }
      }));

      const request = await loadRenderRequestFromConfig(config);
      expect(request.background).toEqual({ type: "solid", color: "#f4efe7" });
      expect(request.container.radius).toBe(8);
      expect(request.container.padding).toBe(80);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("renders solid, gradient, and image backgrounds", async () => {
    const dir = await mkdtemp(join(tmpdir(), "decor-bg-"));
    try {
      const image = join(dir, "bg.png");
      await sharp({ create: { width: 12, height: 12, channels: 4, background: "#ff0000" } }).png().toFile(image);
      const solid = await createBackground({ type: "solid", color: "#000000" }, 20, 10);
      const gradient = await createBackground({ type: "gradient", from: "#000", to: "#fff", angle: 90 }, 20, 10);
      const imageBg = await createBackground({ type: "image", path: image, opacity: 0.5, blur: 0 }, 20, 10);
      await expect(sharp(solid).metadata()).resolves.toMatchObject({ width: 20, height: 10 });
      await expect(sharp(gradient).metadata()).resolves.toMatchObject({ width: 20, height: 10 });
      await expect(sharp(imageBg).metadata()).resolves.toMatchObject({ width: 20, height: 10 });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
