import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { installDefaultBackgrounds } from "../src/backgrounds/install-default-backgrounds.js";
import type { DefaultBackgroundAsset } from "../src/backgrounds/default-background-manifest.js";

const servers: Server[] = [];

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function startAssetServer(files: Record<string, Buffer>): Promise<string> {
  const server = createServer((request, response) => {
    const name = request.url?.replace(/^\//, "") ?? "";
    const content = files[name];
    if (!content) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-length": content.byteLength });
    response.end(content);
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing fixture server port");
  return `http://127.0.0.1:${address.port}`;
}

function asset(baseUrl: string, fileName: string, content: Buffer, sha = sha256(content)): DefaultBackgroundAsset {
  return {
    fileName,
    url: `${baseUrl}/${fileName}`,
    bytes: content.byteLength,
    sha256: sha,
    contentType: "image/png"
  };
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe("installDefaultBackgrounds", () => {
  it("installs, skips, and force-updates manifest assets", async () => {
    const installDir = await mkdtemp(join(tmpdir(), "decor-backgrounds-"));
    const baseUrl = await startAssetServer({
      "one.png": Buffer.from("one"),
      "two.png": Buffer.from("two")
    });
    const assets = [
      asset(baseUrl, "one.png", Buffer.from("one")),
      asset(baseUrl, "two.png", Buffer.from("two"))
    ];

    try {
      const first = await installDefaultBackgrounds({ dir: installDir, assets, allowInsecureUrls: true });
      expect(first).toMatchObject({ installed: 2, updated: 0, skipped: 0, total: 2 });
      await expect(readFile(join(installDir, "one.png"), "utf8")).resolves.toBe("one");

      const second = await installDefaultBackgrounds({ dir: installDir, assets, allowInsecureUrls: true });
      expect(second).toMatchObject({ installed: 0, updated: 0, skipped: 2, total: 2 });

      const forced = await installDefaultBackgrounds({ dir: installDir, assets, force: true, allowInsecureUrls: true });
      expect(forced).toMatchObject({ installed: 0, updated: 2, skipped: 0, total: 2 });
    } finally {
      await rm(installDir, { recursive: true, force: true });
    }
  });

  it("rejects corrupted downloads before replacing existing files", async () => {
    const installDir = await mkdtemp(join(tmpdir(), "decor-backgrounds-"));
    const target = join(installDir, "bad.png");
    const baseUrl = await startAssetServer({ "bad.png": Buffer.from("bad") });

    try {
      await writeFile(target, "existing");
      await expect(installDefaultBackgrounds({
        dir: installDir,
        assets: [asset(baseUrl, "bad.png", Buffer.from("bad"), "0".repeat(64))],
        allowInsecureUrls: true
      })).rejects.toThrow("Checksum mismatch");
      await expect(readFile(target, "utf8")).resolves.toBe("existing");
    } finally {
      await rm(installDir, { recursive: true, force: true });
    }
  });

  it("rejects oversized downloads before replacing existing files", async () => {
    const installDir = await mkdtemp(join(tmpdir(), "decor-backgrounds-"));
    const target = join(installDir, "large.png");
    const baseUrl = await startAssetServer({ "large.png": Buffer.from("too-large") });
    const expected = Buffer.from("tiny");

    try {
      await writeFile(target, "existing");
      await expect(installDefaultBackgrounds({
        dir: installDir,
        assets: [asset(baseUrl, "large.png", expected)],
        allowInsecureUrls: true
      })).rejects.toThrow("Size mismatch");
      await expect(readFile(target, "utf8")).resolves.toBe("existing");
    } finally {
      await rm(installDir, { recursive: true, force: true });
    }
  });

  it("rejects insecure manifest URLs unless tests explicitly allow them", async () => {
    const installDir = await mkdtemp(join(tmpdir(), "decor-backgrounds-"));
    const content = Buffer.from("one");
    const assets = [asset("http://127.0.0.1:1234", "one.png", content)];

    try {
      await expect(installDefaultBackgrounds({ dir: installDir, assets })).rejects.toThrow("must use HTTPS");
    } finally {
      await rm(installDir, { recursive: true, force: true });
    }
  });
});
