import { normalizeRenderRequest } from "../config/merge-render-request.js";
import type { RenderRequest } from "../contracts/render-request.js";
import { createTempWorkspace } from "../io/temp-workspace.js";
import { resolveInputSource } from "../input/resolve-input-source.js";
import { probeMedia } from "../probe/probe-media.js";
import { renderImage } from "./render-image.js";
import { renderVideo } from "./render-video.js";

export async function runRenderJob(rawRequest: unknown) {
  const request: RenderRequest = normalizeRenderRequest(rawRequest);
  const workspace = await createTempWorkspace(request.options.keepTemp);
  try {
    const input = await resolveInputSource(request.input, workspace.path, request.options);
    const metadata = await probeMedia(input.path, request.options);
    if (metadata.kind === "video") {
      return await renderVideo(input.path, metadata, request, workspace.path);
    }
    return await renderImage(input.path, metadata, request);
  } finally {
    await workspace.cleanup();
  }
}
