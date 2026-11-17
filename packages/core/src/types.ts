export interface ColumnDef {
  id: string;
  name: string;
  wipLimit: number | null;
}

export interface Project {
  id: string;
  name: string;
  columns: ColumnDef[];
  createdAt: string;
}

export interface Card {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: number; // 0 = low, 1 = normal, 2 = high
  assignee: string | null;
  agent: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardSnapshot {
  project: Project;
  cards: Card[];
}

export interface CardUpdate {
  title?: string;
  description?: string | null;
  priority?: number;
  error?: string | null;
}

export interface MoveResult {
  ok: boolean;
  card?: Card;
  error?: string;
}

export const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: "backlog", name: "Backlog", wipLimit: null },
  { id: "todo", name: "To Do", wipLimit: 5 },
  { id: "in_progress", name: "In Progress", wipLimit: 3 },
  { id: "in_review", name: "In Review", wipLimit: 4 },
  { id: "done", name: "Done", wipLimit: null }
];
