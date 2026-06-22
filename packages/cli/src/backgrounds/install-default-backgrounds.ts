import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import {
  DEFAULT_BACKGROUND_MANIFEST,
  type DefaultBackgroundAsset
} from "./default-background-manifest.js";
import { resolveDefaultBackgroundDir } from "./resolve-default-background-dir.js";

type FileStatus = "installed" | "updated" | "skipped";

export interface InstalledBackgroundFile {
  fileName: string;
  path: string;
  status: FileStatus;
  bytes: number;
  sha256: string;
}

export interface InstallDefaultBackgroundsOptions {
  dir?: string;
  force?: boolean;
  assets?: readonly DefaultBackgroundAsset[];
  fetchImpl?: typeof fetch;
  allowInsecureUrls?: boolean;
  downloadTimeoutMs?: number;
}

export interface InstallDefaultBackgroundsResult {
  installDir: string;
  total: number;
  installed: number;
  updated: number;
  skipped: number;
  files: InstalledBackgroundFile[];
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function existingMatches(path: string, asset: DefaultBackgroundAsset): Promise<boolean> {
  try {
    const content = await readFile(path);
    return content.byteLength === asset.bytes && sha256(content) === asset.sha256;
  } catch {
    return false;
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function validateAsset(asset: DefaultBackgroundAsset, allowInsecureUrls: boolean): void {
  if (basename(asset.fileName) !== asset.fileName) throw new Error(`Invalid background filename: ${asset.fileName}`);
  const url = new URL(asset.url);
  if (!allowInsecureUrls && url.protocol !== "https:") throw new Error(`Default background URL must use HTTPS: ${asset.fileName}`);
}

async function readCappedBody(asset: DefaultBackgroundAsset, response: Response): Promise<Buffer> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error(`Missing response body for ${asset.fileName}`);

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > asset.bytes) {
      await reader.cancel();
      throw new Error(`Size mismatch for ${asset.fileName}`);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, totalBytes);
}

async function downloadAsset(asset: DefaultBackgroundAsset, fetchImpl: typeof fetch, timeoutMs: number): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(asset.url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Failed to download ${asset.fileName}: HTTP ${response.status}`);
    const contentLength = Number(response.headers.get("content-length") ?? asset.bytes);
    if (contentLength > asset.bytes) throw new Error(`Size mismatch for ${asset.fileName}`);
    return await readCappedBody(asset, response);
  } finally {
    clearTimeout(timeout);
  }
}

function verifyDownloadedAsset(asset: DefaultBackgroundAsset, buffer: Buffer): void {
  const actualHash = sha256(buffer);
  if (buffer.byteLength !== asset.bytes) throw new Error(`Size mismatch for ${asset.fileName}`);
  if (actualHash !== asset.sha256) throw new Error(`Checksum mismatch for ${asset.fileName}`);
}

export async function installDefaultBackgrounds(options: InstallDefaultBackgroundsOptions = {}): Promise<InstallDefaultBackgroundsResult> {
  const installDir = resolveDefaultBackgroundDir(options.dir);
  const assets = options.assets ?? DEFAULT_BACKGROUND_MANIFEST.assets;
  const fetchImpl = options.fetchImpl ?? fetch;
  const downloadTimeoutMs = options.downloadTimeoutMs ?? 30000;
  const files: InstalledBackgroundFile[] = [];

  await mkdir(installDir, { recursive: true });

  for (const asset of assets) {
    validateAsset(asset, Boolean(options.allowInsecureUrls));
    const targetPath = join(installDir, asset.fileName);
    const targetExists = await exists(targetPath);
    if (!options.force && targetExists && await existingMatches(targetPath, asset)) {
      files.push({ fileName: asset.fileName, path: targetPath, status: "skipped", bytes: asset.bytes, sha256: asset.sha256 });
      continue;
    }

    const tmpPath = join(installDir, `.${asset.fileName}.${process.pid}.${randomUUID()}.tmp`);
    try {
      const content = await downloadAsset(asset, fetchImpl, downloadTimeoutMs);
      verifyDownloadedAsset(asset, content);
      await writeFile(tmpPath, content);
      await rename(tmpPath, targetPath);
    } catch (error) {
      await rm(tmpPath, { force: true });
      throw error;
    }

    files.push({
      fileName: asset.fileName,
      path: targetPath,
      status: targetExists ? "updated" : "installed",
      bytes: asset.bytes,
      sha256: asset.sha256
    });
  }

  return {
    installDir,
    total: files.length,
    installed: files.filter((file) => file.status === "installed").length,
    updated: files.filter((file) => file.status === "updated").length,
    skipped: files.filter((file) => file.status === "skipped").length,
    files
  };
}
