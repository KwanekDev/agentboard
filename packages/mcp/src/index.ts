import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as core from "@agentboard/core";

const server = new McpServer({ name: "agentboard-mcp", version: "0.1.0" });

function text(data: unknown, isError = false) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], isError };
}

server.registerTool("list_projects", {
  title: "List AgentBoard projects",
  description: "List all projects (kanban boards) in AgentBoard.",
  inputSchema: z.object({})
}, async () => {
  try {
    const projects = core.listProjects().map((p) => ({ id: p.id, name: p.name }));
    return text({ projects });
  } catch (e) {
    return text({ error: (e as Error).message }, true);
  }
});

server.registerTool("get_board", {
  title: "Get a kanban board snapshot",
  description: "Read a project board: columns and all cards with statuses, priorities and assignees.",
  inputSchema: z.object({ project_id: z.string().describe("Project id from list_projects") })
}, async ({ project_id }) => {
  try {
    const board = core.getBoard(project_id);
    if (!board) return text({ error: "project not found" }, true);
    return text({
      project: board.project,
      cards: board.cards.map((c) => ({
        id: c.id, title: c.title, description: c.description, status: c.status,
        priority: c.priority, assignee: c.assignee, agent: c.agent, error: c.error, updatedAt: c.updatedAt
      }))
    });
  } catch (e) {
    return text({ error: (e as Error).message }, true);
  }
});

server.registerTool("create_task", {
  title: "Create a task on a board",
  description: "Add a card to the To Do column of a project. Include acceptance criteria in the description.",
  inputSchema: z.object({
    project_id: z.string().describe("Project id"),
    title: z.string().describe("Card title (start with a verb)"),
    description: z.string().optional().describe("Details and acceptance criteria"),
    priority: z.number().optional().describe("0 = low, 1 = normal, 2 = high")
  })
}, async ({ project_id, title, description, priority }) => {
  try {
    const card = core.addCard(project_id, {
      title,
      description: description ?? null,
      priority: priority ?? 1
    });
    return text({ ok: true, card });
  } catch (e) {
    return text({ error: (e as Error).message }, true);
  }
});

server.registerTool("update_task", {
  title: "Update a task",
  description: "Change title, description, priority, or record an error/blocker on a card.",
  inputSchema: z.object({
    task_id: z.string(),
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    priority: z.number().optional(),
    error: z.string().nullable().optional().describe("Blocking reason, or null to clear")
  })
}, async ({ task_id, title, description, priority, error }) => {
  try {
    const result = core.updateCard(task_id, { title, description, priority, error });
    if (!result.ok) return text(result, true);
    return text({ ok: true, card: result.card });
  } catch (e) {
    return text({ error: (e as Error).message }, true);
  }
});

server.registerTool("move_task", {
  title: "Move a task between columns",
  description: "Move a card to another column. Valid statuses: backlog, todo, in_progress, in_review, done. Respects WIP limits.",
  inputSchema: z.object({
    task_id: z.string(),
    status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"])
  })
}, async ({ task_id, status }) => {
  try {
    const result = core.moveCard(task_id, status);
    if (!result.ok) return text(result, true);
    return text({ ok: true, card: result.card });
  } catch (e) {
    return text({ error: (e as Error).message }, true);
  }
});

server.registerTool("claim_task", {
  title: "Atomically claim a task",
  description: "Claim the next todo/backlog card. Only one agent can claim a card. Sets status to in_progress.",
  inputSchema: z.object({
    task_id: z.string(),
    session: z.string().describe("Your agent/session identifier"),
    agent: z.string().optional().describe("Optional label, e.g. claude-code")
  })
}, async ({ task_id, session, agent }) => {
  try {
    const result = core.claimCard(task_id, session, agent ?? null);
    if (!result.ok) return text(result, true);
    return text({ ok: true, card: result.card });
  } catch (e) {
    return text({ error: (e as Error).message }, true);
  }
});

server.registerTool("release_task", {
  title: "Release a task back to To Do",
  description: "Unclaim a card, clear assignee/agent/error, move it back to todo.",
  inputSchema: z.object({ task_id: z.string() })
}, async ({ task_id }) => {
  try {
    const result = core.releaseCard(task_id);
    return text({ ok: true, card: result.card });
  } catch (e) {
    return text({ error: (e as Error).message }, true);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
