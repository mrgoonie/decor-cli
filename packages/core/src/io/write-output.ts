import { constants } from "node:fs";
import { access, link, lstat, mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { DecorError } from "../errors.js";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function assertOutputAllowed(path: string, overwrite: boolean): Promise<string> {
  const resolved = resolve(path);
  if (await exists(resolved)) {
    const stat = await lstat(resolved);
    if (stat.isSymbolicLink()) {
      throw new DecorError("unsafe_output_path", "Refusing to write through a symlink output path.");
    }
    if (!overwrite) {
      throw new DecorError("output_exists", `Output already exists: ${resolved}`, [
        "Pass overwrite: true or choose a different output path."
      ]);
    }
  }
  await mkdir(dirname(resolved), { recursive: true });
  return resolved;
}

export async function reserveAtomicOutput(path: string, overwrite: boolean): Promise<{ outputPath: string; tempPath: string }> {
  const outputPath = await assertOutputAllowed(path, overwrite);
  const ext = extname(outputPath);
  const tempPath = `${outputPath}.${randomUUID()}${ext || ".tmp"}`;
  return { outputPath, tempPath };
}

export async function publishAtomicOutput(tempPath: string, outputPath: string, overwrite: boolean): Promise<string> {
  if (overwrite) {
    await rename(tempPath, outputPath);
    return outputPath;
  }
  try {
    await link(tempPath, outputPath);
    return outputPath;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
      throw new DecorError("output_exists", `Output already exists: ${outputPath}`, [
        "Pass overwrite: true or choose a different output path."
      ]);
    }
    throw error;
  } finally {
    await unlink(tempPath).catch(() => undefined);
  }
}

export async function writeAtomic(path: string, data: Buffer, overwrite: boolean): Promise<string> {
  const reserved = await reserveAtomicOutput(path, overwrite);
  try {
    await writeFile(reserved.tempPath, data, { flag: "wx" });
    return await publishAtomicOutput(reserved.tempPath, reserved.outputPath, overwrite);
  } catch (error) {
    await unlink(reserved.tempPath).catch(() => undefined);
    throw error;
  }
}
