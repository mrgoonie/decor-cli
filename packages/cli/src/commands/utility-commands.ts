import { existsSync } from "node:fs";
import { Command } from "commander";
import { doctorFfmpeg, listTemplates, loadRenderRequestFromConfig } from "decor-cli-core";
import { exitCodeFor, printError, printResult } from "../formatters/output.js";

export function addUtilityCommands(program: Command): void {
  program.command("list-templates")
    .description("List built-in templates.")
    .action((_, command) => {
      printResult(listTemplates(), command.optsWithGlobals());
    });

  program.command("doctor")
    .description("Check local dependencies and configuration.")
    .action((_, command) => {
      printResult(doctorFfmpeg(), command.optsWithGlobals());
    });

  program.command("validate")
    .description("Validate a render config file.")
    .requiredOption("-c, --config <path>", "JSON render config")
    .action(async (options, command) => {
      const globals = command.optsWithGlobals();
      try {
        await loadRenderRequestFromConfig(options.config);
        printResult({ valid: true, path: options.config }, globals);
      } catch (error) {
        printError(error, Boolean(globals.json));
        process.exitCode = exitCodeFor(error);
      }
    });

  program.command("config")
    .description("Inspect config path resolution.")
    .option("-c, --config <path>", "JSON render config")
    .action((options, command) => {
      printResult({ config: options.config ?? null, exists: options.config ? existsSync(options.config) : false }, command.optsWithGlobals());
    });
}
