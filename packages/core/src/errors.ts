export type DecorErrorCode =
  | "invalid_input"
  | "unsafe_url"
  | "input_too_large"
  | "media_probe_failed"
  | "render_failed"
  | "ffmpeg_missing"
  | "output_exists"
  | "unsafe_output_path"
  | "config_invalid";

export class DecorError extends Error {
  readonly code: DecorErrorCode;
  readonly nextActions: string[];

  constructor(code: DecorErrorCode, message: string, nextActions: string[] = []) {
    super(message);
    this.name = "DecorError";
    this.code = code;
    this.nextActions = nextActions;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof DecorError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        next_actions: error.nextActions
      }
    };
  }
  return {
    ok: false,
    error: {
      code: "render_failed",
      message: error instanceof Error ? error.message : "Unknown error",
      next_actions: ["Run decor doctor to verify local dependencies."]
    }
  };
}
