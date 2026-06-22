import { lookup } from "node:dns/promises";
import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";
import type { IncomingMessage } from "node:http";
import { createWriteStream } from "node:fs";
import { copyFile, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { once } from "node:events";
import { DecorError } from "../errors.js";
import type { InputSource, RenderOptions } from "../contracts/render-request.js";
import { isDeniedIp } from "./ip-policy.js";

export interface ResolvedInput {
  path: string;
  sourceDescription: string;
}

async function assertSafeUrl(url: URL, allowPrivateNetwork: boolean): Promise<void> {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new DecorError("unsafe_url", "Only http and https URLs are supported.");
  }
  const results = await lookup(url.hostname, { all: true });
  if (!allowPrivateNetwork && results.some((result) => isDeniedIp(result.address))) {
    throw new DecorError("unsafe_url", "URL resolves to a private, loopback, or link-local address.");
  }
}

async function resolveSafeAddress(url: URL, allowPrivateNetwork: boolean) {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new DecorError("unsafe_url", "Only http and https URLs are supported.");
  }
  const results = await lookup(url.hostname, { all: true });
  if (results.length === 0) {
    throw new DecorError("unsafe_url", "URL hostname did not resolve.");
  }
  if (!allowPrivateNetwork && results.some((result) => isDeniedIp(result.address))) {
    throw new DecorError("unsafe_url", "URL resolves to a private, loopback, or link-local address.");
  }
  return results[0];
}

async function streamResponseToFile(response: IncomingMessage, path: string, maxBytes: number): Promise<void> {
  const length = response.headers["content-length"];
  if (length && Number(length) > maxBytes) {
    throw new DecorError("input_too_large", "Remote input is larger than the configured byte limit.");
  }
  const writer = createWriteStream(path, { flags: "wx" });
  let received = 0;
  try {
    for await (const chunk of response as AsyncIterable<Uint8Array>) {
      received += chunk.byteLength;
      if (received > maxBytes) {
        throw new DecorError("input_too_large", "Remote input exceeded the configured byte limit.");
      }
      if (!writer.write(chunk)) {
        await once(writer, "drain");
      }
    }
  } finally {
    writer.end();
  }
  await once(writer, "finish");
}

async function requestUrl(url: URL, options: RenderOptions): Promise<IncomingMessage> {
  const pinned = await resolveSafeAddress(url, options.allowPrivateNetwork);
  const getter = url.protocol === "https:" ? httpsGet : httpGet;
  return new Promise((resolveResponse, reject) => {
    const request = getter(url, {
      lookup: (_hostname, _options, callback) => {
        callback(null, pinned.address, pinned.family);
      },
      timeout: options.requestTimeoutMs
    }, resolveResponse);
    request.on("timeout", () => request.destroy(new DecorError("invalid_input", "URL request timed out.")));
    request.on("error", reject);
  });
}

async function downloadUrl(source: string, tempDir: string, options: RenderOptions): Promise<string> {
  let current = new URL(source);
  for (let redirect = 0; redirect <= options.maxRedirects; redirect += 1) {
    await assertSafeUrl(current, options.allowPrivateNetwork);
    const response = await requestUrl(current, options);
    if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
      const location = response.headers.location;
      response.resume();
      if (!location) {
        throw new DecorError("unsafe_url", "Redirect response did not include a Location header.");
      }
      current = new URL(location, current);
      continue;
    }
    if ((response.statusCode ?? 500) < 200 || (response.statusCode ?? 500) > 299) {
      response.resume();
      throw new DecorError("invalid_input", `URL returned HTTP ${response.statusCode}.`);
    }
    const output = join(tempDir, `remote-${Date.now()}-${basename(current.pathname) || "input"}`);
    await streamResponseToFile(response, output, options.maxInputBytes);
    return output;
  }
  throw new DecorError("unsafe_url", "URL exceeded the maximum redirect count.");
}

function decodeBase64Payload(value: string): Buffer {
  let normalized = value.trim();
  if (normalized.startsWith("data:")) {
    const match = normalized.match(/^data:[^,]*;base64,(.*)$/is);
    if (!match) {
      throw new DecorError("invalid_input", "Base64 data URI must include ;base64.");
    }
    normalized = match[1];
  }
  normalized = normalized.replace(/\s+/g, "");
  const valid = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalized);
  if (!normalized || !valid) {
    throw new DecorError("invalid_input", "Base64 input is malformed.");
  }
  return Buffer.from(normalized, "base64");
}

export async function resolveInputSource(source: InputSource, tempDir: string, options: RenderOptions): Promise<ResolvedInput> {
  if (source.type === "path") {
    const inputPath = resolve(source.path);
    const inputStat = await stat(inputPath);
    if (inputStat.size > options.maxInputBytes) {
      throw new DecorError("input_too_large", "Input file is larger than the configured byte limit.");
    }
    const copyPath = join(tempDir, `local-${basename(inputPath)}`);
    await copyFile(inputPath, copyPath);
    return { path: copyPath, sourceDescription: "path" };
  }

  if (source.type === "url") {
    const path = await downloadUrl(source.url, tempDir, options);
    return { path, sourceDescription: "url" };
  }

  const normalized = source.data.startsWith("data:")
    ? source.data.replace(/^data:[^,]*;base64,/is, "").replace(/\s+/g, "")
    : source.data.trim().replace(/\s+/g, "");
  const estimatedBytes = Math.floor((normalized.length * 3) / 4);
  if (estimatedBytes > options.maxInputBytes) {
    throw new DecorError("input_too_large", "Base64 input is larger than the configured byte limit.");
  }
  const data = decodeBase64Payload(source.data);
  if (data.length > options.maxInputBytes) {
    throw new DecorError("input_too_large", "Decoded base64 input is larger than the configured byte limit.");
  }
  const path = join(tempDir, `base64-input-${Date.now()}`);
  await writeFile(path, data, { flag: "wx" });
  return { path, sourceDescription: "base64" };
}
