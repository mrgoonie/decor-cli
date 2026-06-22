import { Command } from "commander";
import { runRenderJob } from "decor-cli-core";
import { buildRenderRequest } from "../options/build-render-request.js";
import { exitCodeFor, printError, printResult } from "../formatters/output.js";

export function addRenderCommand(program: Command): void {
  program.command("render")
    .description("Render a decorated image or video output.")
    .option("-i, --input <path>", "input file path")
    .option("--input-url <url>", "input HTTP/HTTPS URL")
    .option("--input-base64 <value>", "input Base64 payload or data URI")
    .requiredOption("-o, --output <path>", "output file path")
    .option("-c, --config <path>", "JSON render config")
    .option("-t, --template <name>", "built-in template name")
    .option("--background <path>", "background image path")
    .option("--background-folder <path>", "folder to pick a random background image from")
    .option("--background-opacity <n>", "background image opacity")
    .option("--gradient <from,to,angle>", "gradient background")
    .option("--padding <px>", "container padding")
    .option("--radius <px>", "container corner radius")
    .option("--shadow-opacity <n>", "container shadow opacity")
    .option("--shadow-blur <px>", "container shadow blur")
    .option("--alignment <name>", "container alignment")
    .option("--crop <x,y,width,height>", "crop rectangle")
    .option("--text <value>", "quick text annotation")
    .option("--text-position <x,y>", "quick text annotation position")
    .option("--quality <n>", "output quality")
    .option("--json-options <json>", "raw JSON options merged into the request")
    .option("--allow-private-network", "allow URL inputs resolving to private networks")
    .option("--overwrite", "overwrite existing output")
    .action(async (options, command) => {
      const globals = command.optsWithGlobals();
      try {
        const request = await buildRenderRequest(options);
        const result = await runRenderJob(request);
        printResult(result, globals);
      } catch (error) {
        printError(error, Boolean(globals.json));
        process.exitCode = exitCodeFor(error);
      }
    });
}
