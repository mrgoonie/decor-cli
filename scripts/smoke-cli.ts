import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["packages/cli/dist/bin/decor.js", "list-templates", "--json"], {
  encoding: "utf8"
});
if (result.status !== 0) {
  console.error(result.stderr);
  process.exit(result.status ?? 1);
}
console.log(result.stdout.trim());
