import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { addRenderCommand } from "./commands/render-command.js";
import { addPreviewCommand } from "./commands/preview-command.js";
import { addUtilityCommands } from "./commands/utility-commands.js";

function readPackageVersion(): string {
  try {
    const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), "../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: unknown };
    return typeof packageJson.version === "string" ? packageJson.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function createProgram(): Command {
  const program = new Command();
  program
    .name("decor")
    .description("Decorate images and videos with backgrounds, templates, and annotations.")
    .version(readPackageVersion())
    .option("--json", "print machine-readable JSON")
    .option("--quiet", "suppress non-error text output")
    .option("--verbose", "print verbose diagnostics");

  addRenderCommand(program);
  addPreviewCommand(program);
  addUtilityCommands(program);
  return program;
}
