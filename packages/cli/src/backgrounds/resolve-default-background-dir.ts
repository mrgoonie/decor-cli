import { homedir } from "node:os";
import { join, resolve } from "node:path";

export function resolveDefaultBackgroundDir(dir?: string): string {
  if (!dir) return join(homedir(), ".decor-cli", "backgrounds");
  if (dir === "~") return homedir();
  if (dir.startsWith("~/") || dir.startsWith("~\\")) return join(homedir(), dir.slice(2));
  return resolve(dir);
}
