import { Command } from "commander";
import { runRenderJob } from "decor-cli-core";
import { buildRenderRequest } from "../options/build-render-request.js";
import { exitCodeFor, printError, printResult } from "../formatters/output.js";

export function addPreviewCommand(program: Command): void {
  program.command("preview")
    .description("Render a preview using the same core pipeline.")
    .option("-i, --input <path>", "input file path")
    .option("--input-url <url>", "input HTTP/HTTPS URL")
    .option("--input-base64 <value>", "input Base64 payload or data URI")
    .option("-o, --output <path>", "preview output path", "decor-preview.png")
    .option("-c, --config <path>", "JSON render config")
    .option("-t, --template <name>", "built-in template name")
    .option("--overwrite", "overwrite existing output")
    .option("--allow-private-network", "allow URL inputs resolving to private networks")
    .action(async (options, command) => {
      const globals = command.optsWithGlobals();
      try {
        const request = await buildRenderRequest(options, true);
        printResult(await runRenderJob(request), globals);
      } catch (error) {
        printError(error, Boolean(globals.json));
        process.exitCode = exitCodeFor(error);
      }
    });
}
