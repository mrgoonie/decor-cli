import { toErrorResponse } from "decor-cli-core";

export interface CommandContext {
  json: boolean;
  quiet: boolean;
}

export function printResult(result: unknown, context: CommandContext): void {
  if (context.json) {
    process.stdout.write(`${JSON.stringify({ ok: true, data: result }, null, 2)}\n`);
    return;
  }
  if (!context.quiet) {
    process.stdout.write(`${typeof result === "string" ? result : JSON.stringify(result, null, 2)}\n`);
  }
}

export function printError(error: unknown, json: boolean): void {
  const response = toErrorResponse(error);
  if (json) {
    process.stderr.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }
  process.stderr.write(`Error: ${response.error.message}\n`);
  for (const action of response.error.next_actions) {
    process.stderr.write(`- ${action}\n`);
  }
}

export function exitCodeFor(error: unknown): number {
  const response = toErrorResponse(error);
  if (["invalid_input", "config_invalid", "output_exists", "unsafe_output_path"].includes(response.error.code)) return 1;
  if (["unsafe_url", "input_too_large"].includes(response.error.code)) return 4;
  if (response.error.code === "ffmpeg_missing") return 4;
  return 4;
}
