import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue } from "node:sqlite";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { BoardSnapshot, Card, CardUpdate, ColumnDef, MoveResult, Project } from "./types";
import { DEFAULT_COLUMNS } from "./types";

let cached: DatabaseSync | null = null;
let rootCache: string | null = null;

export function findRepoRoot(start = process.cwd()): string {
  if (rootCache) return rootCache;
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      rootCache = dir;
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  rootCache = start;
  return start;
}

export function databasePath(): string {
  if (process.env.AGENTBOARD_DB) return path.resolve(process.env.AGENTBOARD_DB);
  return path.join(findRepoRoot(), "data", "app.db");
}

export function getDb(): DatabaseSync {
  if (cached) return cached;
  const file = databasePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  columns TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  assignee TEXT,
  agent TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cards_project ON cards(project_id, status);
`);
  cached = db;
  return db;
}

function parseColumns(raw: string): ColumnDef[] {
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length > 0) return arr as ColumnDef[];
  } catch { /* fall through */ }
  return DEFAULT_COLUMNS;
}

interface ProjectRow { id: string; name: string; columns: string; created_at: string }
interface CardRow {
  id: string; project_id: string; title: string; description: string | null;
  status: string; priority: number; assignee: string | null; agent: string | null;
  error: string | null; created_at: string; updated_at: string
}

function toProject(row: ProjectRow, columns?: ColumnDef[]): Project {
  return { id: row.id, name: row.name, columns: columns ?? parseColumns(row.columns), createdAt: row.created_at };
}

function toCard(row: CardRow): Card {
  return {
    id: row.id, projectId: row.project_id, title: row.title, description: row.description,
    status: row.status, priority: row.priority, assignee: row.assignee, agent: row.agent,
    error: row.error, createdAt: row.created_at, updatedAt: row.updated_at
  };
}

export function createProject(name: string, columns?: ColumnDef[]): Project {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const cols = columns && columns.length > 0 ? columns : DEFAULT_COLUMNS;
  db.prepare("INSERT INTO projects (id, name, columns, created_at) VALUES (?, ?, ?, ?)")
    .run(id, name, JSON.stringify(cols), now);
  return toProject(db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as unknown as ProjectRow);
}

export function listProjects(): Project[] {
  const db = getDb();
  return (db.prepare("SELECT * FROM projects ORDER BY created_at ASC").all() as unknown as ProjectRow[])
    .map((r) => toProject(r));
}

export function getProject(id: string): Project | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
  return row ? toProject(row) : null;
}

export function getBoard(id: string): BoardSnapshot | null {
  const project = getProject(id);
  if (!project) return null;
  const db = getDb();
  const cards = (db.prepare("SELECT * FROM cards WHERE project_id = ? ORDER BY created_at ASC").all(id) as unknown as CardRow[])
    .map(toCard);
  return { project, cards };
}

export function getCard(id: string): Card | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM cards WHERE id = ?").get(id) as CardRow | undefined;
  return row ? toCard(row) : null;
}

export function addCard(projectId: string, input: { title: string; description?: string | null; priority?: number }): Card {
  const db = getDb();
  const project = getProject(projectId);
  if (!project) throw new Error("project not found");
  const id = randomUUID();
  const now = new Date().toISOString();
  const title = input.title.trim();
  if (!title) throw new Error("title is required");
  db.prepare(
    "INSERT INTO cards (id, project_id, title, description, status, priority, created_at, updated_at) VALUES (?, ?, ?, ?, 'todo', ?, ?, ?)"
  ).run(id, projectId, title, input.description ?? null, Math.min(2, Math.max(0, input.priority ?? 0)), now, now);
  return getCard(id) as Card;
}

export function updateCard(taskId: string, patch: CardUpdate): MoveResult {
  const db = getDb();
  const current = getCard(taskId);
  if (!current) return { ok: false, error: "task not found" };
  const fields: string[] = [];
  const values: SQLInputValue[] = [];
  if (patch.title !== undefined) { fields.push("title = ?"); values.push(String(patch.title)); }
  if (patch.description !== undefined) { fields.push("description = ?"); values.push(patch.description); }
  if (patch.priority !== undefined) { fields.push("priority = ?"); values.push(Math.min(2, Math.max(0, patch.priority))); }
  if (patch.error !== undefined) { fields.push("error = ?"); values.push(patch.error); }
  if (fields.length === 0) return { ok: true, card: current };
  fields.push("updated_at = ?");
  values.push(new Date().toISOString(), taskId);
  db.prepare("UPDATE cards SET " + fields.join(", ") + " WHERE id = ?").run(...values);
  return { ok: true, card: getCard(taskId) as Card };
}

export function moveCard(taskId: string, status: string): MoveResult {
  const db = getDb();
  const cardRow = db.prepare("SELECT * FROM cards WHERE id = ?").get(taskId) as CardRow | undefined;
  if (!cardRow) return { ok: false, error: "task not found" };
  const projectRow = db.prepare("SELECT * FROM projects WHERE id = ?").get(cardRow.project_id) as unknown as ProjectRow;
  const columns = parseColumns(projectRow.columns);
  const col = columns.find((c) => c.id === status);
  if (!col) return { ok: false, error: 'unknown column "' + status + '"' };
  if (cardRow.status === status) return { ok: true, card: toCard(cardRow) };
  if (col.wipLimit != null) {
    const count = (db.prepare("SELECT COUNT(*) AS n FROM cards WHERE project_id = ? AND status = ?")
      .get(cardRow.project_id, status) as { n: number }).n;
    if (count >= col.wipLimit) {
      return { ok: false, error: 'WIP limit reached for "' + col.name + '" (' + col.wipLimit + ') — finish or move existing work first' };
    }
  }
  const now = new Date().toISOString();
  db.prepare("UPDATE cards SET status = ?, updated_at = ? WHERE id = ?").run(status, now, taskId);
  return { ok: true, card: getCard(taskId) as Card };
}

export function claimCard(taskId: string, session: string, agent?: string | null): MoveResult {
  const db = getDb();
  const now = new Date().toISOString();
  const res = db.prepare(
    "UPDATE cards SET status = 'in_progress', assignee = ?, agent = ?, updated_at = ? WHERE id = ? AND status IN ('todo','backlog')"
  ).run(session, agent ?? null, now, taskId);
  if (Number(res.changes) === 0) {
    const card = getCard(taskId);
    if (!card) return { ok: false, error: "task not found" };
    return { ok: false, error: "task is already claimed or not claimable (status: " + card.status + ")" };
  }
  return { ok: true, card: getCard(taskId) as Card };
}

export function releaseCard(taskId: string): MoveResult {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE cards SET status = 'todo', assignee = NULL, agent = NULL, error = NULL, updated_at = ? WHERE id = ?")
    .run(now, taskId);
  return { ok: true, card: getCard(taskId) as Card };
}
