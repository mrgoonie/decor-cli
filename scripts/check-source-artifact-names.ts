import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["packages", "scripts", "claude"];
const forbidden = /\b(F\d+|audit|red-team finding|phase-\d\d)\b/i;

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    if (entry.isDirectory()) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}

const offenders: string[] = [];
for (const root of roots) {
  try {
    for await (const path of walk(root)) {
      if (path.endsWith("check-source-artifact-names.ts")) continue;
      if (forbidden.test(path)) offenders.push(path);
      if (/\.(ts|md|json|yml|yaml)$/.test(path)) {
        const content = await readFile(path, "utf8");
        if (forbidden.test(content)) offenders.push(path);
      }
    }
  } catch {
    // Missing roots are acceptable during early scaffolding.
  }
}

if (offenders.length > 0) {
  console.error(`Source artifacts contain plan/finding labels:\n${[...new Set(offenders)].join("\n")}`);
  process.exit(1);
}
