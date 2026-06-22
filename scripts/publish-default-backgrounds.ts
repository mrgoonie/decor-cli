import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { spawnSync } from "node:child_process";

interface Options {
  bucket: string;
  prefix: string;
  examplesDir: string;
  manifestPath: string;
  publicBaseUrl?: string;
  envFile: string;
  skipUpload: boolean;
}

interface Asset {
  fileName: string;
  url: string;
  bytes: number;
  sha256: string;
  contentType: string;
}

const defaults: Options = {
  bucket: "zuey",
  prefix: "decor-cli/default-backgrounds",
  examplesDir: "examples/backgrounds",
  manifestPath: "packages/cli/src/backgrounds/default-background-manifest.ts",
  envFile: ".env",
  skipUpload: false
};
const wranglerPackage = "wrangler@4.103.0";

function parseArgs(argv: string[]): Options {
  const options = { ...defaults };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === "--skip-upload") {
      options.skipUpload = true;
      continue;
    }
    if (!value) throw new Error(`Missing value for ${key}`);
    index += 1;
    if (key === "--bucket") options.bucket = value;
    else if (key === "--prefix") options.prefix = value.replace(/^\/|\/$/g, "");
    else if (key === "--examples-dir") options.examplesDir = value;
    else if (key === "--manifest") options.manifestPath = value;
    else if (key === "--public-base-url") options.publicBaseUrl = normalizePublicBaseUrl(value);
    else if (key === "--env-file") options.envFile = value;
    else throw new Error(`Unknown option: ${key}`);
  }
  options.publicBaseUrl ??= process.env.DECOR_BACKGROUND_PUBLIC_BASE_URL ? normalizePublicBaseUrl(process.env.DECOR_BACKGROUND_PUBLIC_BASE_URL) : undefined;
  if (!options.publicBaseUrl) throw new Error("Pass --public-base-url or DECOR_BACKGROUND_PUBLIC_BASE_URL.");
  return options;
}

function normalizePublicBaseUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("--public-base-url must use HTTPS.");
  return value.replace(/\/$/g, "");
}

function contentType(fileName: string): string {
  const ext = extname(fileName).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
}

async function describeAsset(options: Options, fileName: string): Promise<Asset> {
  const content = await readFile(join(options.examplesDir, fileName));
  return {
    fileName,
    url: `${options.publicBaseUrl}/${options.prefix}/${fileName}`,
    bytes: content.byteLength,
    sha256: createHash("sha256").update(content).digest("hex"),
    contentType: contentType(fileName)
  };
}

function uploadAsset(options: Options, asset: Asset): void {
  const args = [
    "--yes",
    "--package",
    wranglerPackage,
    "wrangler",
    "r2",
    "object",
    "put",
    `${options.bucket}/${options.prefix}/${asset.fileName}`,
    "--file",
    join(options.examplesDir, asset.fileName),
    "--content-type",
    asset.contentType,
    "--cache-control",
    "public, max-age=31536000, immutable",
    "--env-file",
    options.envFile,
    "--remote"
  ];
  const result = spawnSync("npx", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`wrangler upload failed for ${asset.fileName}: ${result.stderr.trim()}`);
}

async function verifyAsset(asset: Asset): Promise<void> {
  const response = await fetch(asset.url);
  if (!response.ok) throw new Error(`Public URL failed for ${asset.fileName}: HTTP ${response.status}`);
  const content = Buffer.from(await response.arrayBuffer());
  const actualHash = createHash("sha256").update(content).digest("hex");
  if (content.byteLength !== asset.bytes || actualHash !== asset.sha256) {
    throw new Error(`Public object verification failed for ${asset.fileName}`);
  }
}

function renderManifest(options: Options, assets: Asset[]): string {
  return `export interface DefaultBackgroundAsset {
  fileName: string;
  url: string;
  bytes: number;
  sha256: string;
  contentType: string;
}

export interface DefaultBackgroundManifest {
  version: 1;
  source: string;
  assets: readonly DefaultBackgroundAsset[];
}

export const DEFAULT_BACKGROUND_MANIFEST: DefaultBackgroundManifest = ${JSON.stringify({
    version: 1,
    source: `Cloudflare R2 bucket ${options.bucket}/${options.prefix}`,
    assets
  }, null, 2)};
`;
}

const options = parseArgs(process.argv.slice(2));
const files = (await readdir(options.examplesDir)).filter((file) => /\.(jpe?g|png|webp)$/i.test(file)).sort();
if (files.length === 0) throw new Error(`No background assets found in ${options.examplesDir}.`);
const assets = await Promise.all(files.map((fileName) => describeAsset(options, fileName)));
for (const asset of assets) {
  if (!options.skipUpload) uploadAsset(options, asset);
  await verifyAsset(asset);
  process.stdout.write(`verified ${asset.fileName}\n`);
}
await writeFile(options.manifestPath, renderManifest(options, assets));
process.stdout.write(`wrote ${options.manifestPath}\n`);
