import { chmodSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

type Target = {
  id: string;
  os: string;
  cpu: string;
  sharpPackages: string[];
};

const defaultTargets: Target[] = [
  { id: "linux-amd64", os: "linux", cpu: "x64", sharpPackages: ["@img/sharp-linux-x64", "@img/sharp-libvips-linux-x64"] },
  { id: "linux-arm64", os: "linux", cpu: "arm64", sharpPackages: ["@img/sharp-linux-arm64", "@img/sharp-libvips-linux-arm64"] },
  { id: "darwin-amd64", os: "darwin", cpu: "x64", sharpPackages: ["@img/sharp-darwin-x64", "@img/sharp-libvips-darwin-x64"] },
  { id: "darwin-arm64", os: "darwin", cpu: "arm64", sharpPackages: ["@img/sharp-darwin-arm64", "@img/sharp-libvips-darwin-arm64"] },
  { id: "windows-amd64", os: "win32", cpu: "x64", sharpPackages: ["@img/sharp-win32-x64"] }
];

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function parseArgs(): { version: string; targets: Target[] } {
  const version = process.argv[2];
  if (!version) {
    throw new Error("Usage: npm run release:assets -- <version> [--targets linux-amd64,darwin-arm64]");
  }
  const targetArg = process.argv.find((arg) => arg.startsWith("--targets="));
  const ids = targetArg?.slice("--targets=".length).split(",").filter(Boolean);
  const targets = ids ? defaultTargets.filter((target) => ids.includes(target.id)) : defaultTargets;
  if (targets.length === 0) {
    throw new Error(`No known targets matched: ${ids?.join(",")}`);
  }
  return { version, targets };
}

function packageDependencies(): Record<string, string> {
  const cli = readJson<{ dependencies?: Record<string, string> }>("packages/cli/package.json");
  const core = readJson<{ dependencies?: Record<string, string> }>("packages/core/package.json");
  const mcp = readJson<{ dependencies?: Record<string, string> }>("packages/mcp/package.json");
  const dependencies = { ...core.dependencies, ...cli.dependencies, ...mcp.dependencies };
  delete dependencies["decor-cli-core"];
  return dependencies;
}

function copyWorkspacePackage(name: string, destination: string): void {
  const source = join("packages", name);
  const packageName = name === "cli" ? "decor-cli" : `decor-cli-${name}`;
  const packageRoot = join(destination, "app", "node_modules", packageName);
  mkdirSync(packageRoot, { recursive: true });
  cpSync(join(source, "dist"), join(packageRoot, "dist"), { recursive: true });
  cpSync(join(source, "package.json"), join(packageRoot, "package.json"));
}

function writeWrappers(destination: string): void {
  const sh = (modulePath: string) => `#!/usr/bin/env sh
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec node "$DIR/app/node_modules/${modulePath}" "$@"
`;
  const cmd = (modulePath: string) => `@echo off\r
node "%~dp0app\\node_modules\\${modulePath.replaceAll("/", "\\")}" %*\r
`;
  const wrappers = [
    ["decor", "decor-cli/dist/bin/decor.js"],
    ["decor-cli", "decor-cli/dist/bin/decor.js"],
    ["decor-mcp", "decor-cli-mcp/dist/bin/decor-mcp.js"]
  ];
  for (const [name, modulePath] of wrappers) {
    const unixPath = join(destination, name);
    writeFileSync(unixPath, sh(modulePath));
    chmodSync(unixPath, 0o755);
    writeFileSync(join(destination, `${name}.cmd`), cmd(modulePath));
  }
}

function installDependencies(appRoot: string, target: Target): void {
  const env = { ...process.env, npm_config_os: target.os, npm_config_cpu: target.cpu };
  execFileSync("npm", ["install", "--omit=dev", "--no-package-lock"], {
    cwd: appRoot,
    env,
    stdio: "inherit"
  });
  const sharp = readJson<{ optionalDependencies?: Record<string, string> }>(join(appRoot, "node_modules", "sharp", "package.json"));
  const targetSharpPackages = target.sharpPackages.map((name) => {
    const version = sharp.optionalDependencies?.[name];
    if (!version) {
      throw new Error(`sharp optional dependency not found for ${name}`);
    }
    return `${name}@${version}`;
  });
  execFileSync("npm", ["install", "--omit=dev", "--no-package-lock", "--no-save", "--force", ...targetSharpPackages], {
    cwd: appRoot,
    env,
    stdio: "inherit"
  });
}

function createArchive(version: string, target: Target): void {
  const outDir = resolve("dist-github-assets");
  const tempDir = resolve("tmp", "github-release-assets", target.id);
  const rootName = `decor-cli-v${version}-${target.id}`;
  const root = join(tempDir, rootName);
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(join(root, "app"), { recursive: true });

  writeFileSync(
    join(root, "app", "package.json"),
    JSON.stringify({ private: true, type: "module", dependencies: packageDependencies() }, null, 2)
  );
  installDependencies(join(root, "app"), target);
  copyWorkspacePackage("core", root);
  copyWorkspacePackage("cli", root);
  copyWorkspacePackage("mcp", root);
  writeWrappers(root);
  writeFileSync(join(root, "README.txt"), `decor-cli ${version} portable archive for ${target.id}.
Requires Node.js 20+ and ffmpeg/ffprobe on PATH for video rendering.
Run ./decor --help or ./decor-mcp --help after extraction.
`);

  mkdirSync(outDir, { recursive: true });
  const archive = join(outDir, `${rootName}.tar.gz`);
  rmSync(archive, { force: true });
  execFileSync("tar", ["-czf", archive, "-C", tempDir, rootName], { stdio: "inherit" });
  console.log(`Created ${archive}`);
}

const { version, targets } = parseArgs();
rmSync("dist-github-assets", { recursive: true, force: true });
for (const target of targets) {
  createArchive(version, target);
}
