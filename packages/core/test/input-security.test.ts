import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { resolveInputSource } from "../src/input/resolve-input-source.js";

function localServer() {
  const server = createServer((_, res) => {
    res.writeHead(200, { "content-type": "image/png" });
    res.end(Buffer.alloc(32));
  });
  return new Promise<{ url: string; close: () => Promise<void> }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address === "object" && address) {
        resolve({
          url: `http://127.0.0.1:${address.port}/image.png`,
          close: () => new Promise((done) => server.close(() => done()))
        });
      }
    });
  });
}

describe("input security", () => {
  it("denies private URL targets by default", async () => {
    const server = await localServer();
    const dir = await mkdtemp(join(tmpdir(), "decor-input-"));
    try {
      await expect(resolveInputSource({ type: "url", url: server.url }, dir, {
        allowPrivateNetwork: false,
        maxInputBytes: 1024,
        maxPixels: 1000,
        maxVideoDurationSeconds: 1,
        requestTimeoutMs: 1000,
        maxRedirects: 1,
        keepTemp: false
      })).rejects.toThrow(/private/);
    } finally {
      await server.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
