import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function makeTempDb(): { dir: string; file: string; cleanup: () => void } {
  const dir = mkdtempSync(path.join(tmpdir(), "agentboard-core-test-"));
  return {
    dir,
    file: path.join(dir, "app.db"),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
