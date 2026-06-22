import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

export interface TempWorkspace {
  path: string;
  cleanup: () => Promise<void>;
}

export async function createTempWorkspace(keepTemp = false): Promise<TempWorkspace> {
  const path = await mkdtemp(join(tmpdir(), "decor-cli-"));
  let cleaned = false;
  return {
    path,
    cleanup: async () => {
      if (keepTemp || cleaned) {
        return;
      }
      cleaned = true;
      await rm(path, { recursive: true, force: true });
    }
  };
}
