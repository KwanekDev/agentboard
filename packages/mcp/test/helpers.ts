import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const MCP_DIR = path.join(ROOT, "packages", "mcp");
const NODE = "node";
export const MCP_INDEX = path.join(MCP_DIR, "src", "index.ts");
const SEED_SCRIPT = path.join(HERE, "seed.ts");

export interface McpClient {
  call(method: string, params?: Record<string, unknown>): Promise<any>;
  notify(method: string, params?: Record<string, unknown>): void;
  close(): Promise<void>;
}
export interface RunningServer {
  client: McpClient;
  dbFile: string;
  stderr: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function startServer(): Promise<RunningServer> {
  const dbDir = mkdtempSync(path.join(tmpdir(), "agentboard-mcp-test-"));
  const dbFile = path.join(dbDir, "app.db");
  const child: ChildProcessWithoutNullStreams = spawn(NODE, ["--import", "tsx", MCP_INDEX], {
    cwd: MCP_DIR,
    env: { ...process.env, AGENTBOARD_DB: dbFile },
    stdio: ["pipe", "pipe", "pipe"]
  });
  const rl = readline.createInterface({ input: child.stdout });
  let nextId = 1;
  const pending = new Map<number, (v: unknown) => void>();
  rl.on("line", (line) => {
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        const resolve = pending.get(msg.id)!;
        pending.delete(msg.id);
        resolve(msg);
      }
    } catch { /* non-RPC stdout */ }
  });
  const stderr: string[] = [];
  child.stderr.on("data", (d) => stderr.push(String(d)));

  const NL = String.fromCharCode(10);
  const client: McpClient = {
    call(method, params = {}) {
      const id = nextId++;
      const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params });
      return new Promise((resolve, reject) => {
        pending.set(id, resolve);
        child.stdin.write(payload + NL);
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error("timeout waiting for " + method + NL + "STDERR:" + NL + stderr.join("")));
          }
        }, 8000);
      });
    },
    notify(method, params = {}) {
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + NL);
    },
    async close() {
      child.stdin.end();
      await new Promise((r) => child.on("exit", r));
      rmSync(dbDir, { recursive: true, force: true });
    }
  };
  return { client, dbFile, stderr };
}

export async function init(client: McpClient) {
  await client.call("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "agentboard-test", version: "1.0.0" }
  });
  await sleep(120);
  client.notify("notifications/initialized");
  await sleep(120);
}

export function parseText(res: any): any {
  const content = res?.result?.content;
  const text = Array.isArray(content) ? content[0]?.text : undefined;
  if (typeof text !== "string") throw new Error("no text content: " + JSON.stringify(res));
  if (res?.result?.isError) {
    try { return JSON.parse(text); } catch { return { error: text }; }
  }
  return JSON.parse(text);
}

export function isError(res: any): boolean {
  return res?.result?.isError === true;
}

export function seedProject(name: string): { id: string } {
  const dbFile = process.env.AGENTBOARD_DB;
  if (!dbFile) throw new Error("AGENTBOARD_DB not set before seed");
  const out = spawnSync(NODE, ["--import", "tsx", SEED_SCRIPT, dbFile, name], {
    cwd: MCP_DIR,
    encoding: "utf8"
  });
  if (out.status !== 0) throw new Error("seed failed: " + (out.stderr || out.stdout));
  return JSON.parse(out.stdout.trim().split(String.fromCharCode(10)).pop()!);
}
