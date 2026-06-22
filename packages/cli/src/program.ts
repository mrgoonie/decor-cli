import { Command } from "commander";
import { addRenderCommand } from "./commands/render-command.js";
import { addPreviewCommand } from "./commands/preview-command.js";
import { addUtilityCommands } from "./commands/utility-commands.js";

export function createProgram(): Command {
  const program = new Command();
  program
    .name("decor")
    .description("Decorate images and videos with backgrounds, templates, and annotations.")
    .version("0.1.0")
    .option("--json", "print machine-readable JSON")
    .option("--quiet", "suppress non-error text output")
    .option("--verbose", "print verbose diagnostics");

  addRenderCommand(program);
  addPreviewCommand(program);
  addUtilityCommands(program);
  return program;
}
