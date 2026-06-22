import { mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { DecorError, toErrorResponse } from "../src/errors.js";
import { isDeniedIp } from "../src/input/ip-policy.js";
import { resolveInputSource } from "../src/input/resolve-input-source.js";
import { assertOutputAllowed, writeAtomic } from "../src/io/write-output.js";

const renderOptions = {
  allowPrivateNetwork: false,
  maxInputBytes: 1024,
  maxPixels: 1000,
  maxVideoDurationSeconds: 1,
  requestTimeoutMs: 1000,
  maxRedirects: 1,
  keepTemp: false
};

describe("io and network policy", () => {
  it("denies private addresses", () => {
    expect(isDeniedIp("127.0.0.1")).toBe(true);
    expect(isDeniedIp("10.1.2.3")).toBe(true);
    expect(isDeniedIp("8.8.8.8")).toBe(false);
    expect(isDeniedIp("::1")).toBe(true);
    expect(isDeniedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isDeniedIp("::ffff:169.254.169.254")).toBe(true);
    expect(isDeniedIp("::ffff:7f00:1")).toBe(true);
    expect(isDeniedIp("::ffff:a9fe:a9fe")).toBe(true);
    expect(isDeniedIp("ff02::1")).toBe(true);
  });

  it("refuses implicit overwrite and symlink outputs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "decor-io-"));
    try {
      const output = join(dir, "out.txt");
      await writeAtomic(output, Buffer.from("ok"), false);
      await expect(assertOutputAllowed(output, false)).rejects.toThrow(/already exists/);
      const target = join(dir, "target.txt");
      const link = join(dir, "link.txt");
      await writeFile(target, "target");
      await symlink(target, link);
      await expect(assertOutputAllowed(link, true)).rejects.toThrow(/symlink/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("copies path inputs and decodes base64 inputs into the workspace", async () => {
    const dir = await mkdtemp(join(tmpdir(), "decor-inputs-"));
    try {
      const source = join(dir, "source.txt");
      await writeFile(source, "hello");

      const pathInput = await resolveInputSource({ type: "path", path: source }, dir, renderOptions);
      expect(pathInput.sourceDescription).toBe("path");
      await expect(stat(pathInput.path)).resolves.toMatchObject({ size: 5 });

      const base64Input = await resolveInputSource({
        type: "base64",
        data: `data:text/plain;base64,${Buffer.from("base64").toString("base64")}`
      }, dir, renderOptions);
      expect(base64Input.sourceDescription).toBe("base64");
      await expect(readFile(base64Input.path, "utf8")).resolves.toBe("base64");
      await expect(resolveInputSource({ type: "base64", data: "not-base64" }, dir, renderOptions)).rejects.toThrow(/malformed/);
      await expect(resolveInputSource({ type: "base64", data: "data:text/plain,abc" }, dir, renderOptions)).rejects.toThrow(/;base64/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("serializes typed and unknown errors for CLI and MCP callers", () => {
    expect(toErrorResponse(new DecorError("config_invalid", "bad config", ["fix config"]))).toEqual({
      ok: false,
      error: {
        code: "config_invalid",
        message: "bad config",
        next_actions: ["fix config"]
      }
    });
    expect(toErrorResponse(new Error("boom")).error.message).toBe("boom");
    expect(toErrorResponse("boom").error.next_actions).toContain("Run decor doctor to verify local dependencies.");
  });
});
