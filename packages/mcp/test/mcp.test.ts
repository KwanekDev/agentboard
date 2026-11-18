import { test } from "node:test";
import assert from "node:assert/strict";
import { startServer, init, parseText, isError, seedProject, type McpClient } from "./helpers";

async function fresh(): Promise<{ client: McpClient; close: () => Promise<void>; projectId: string }> {
  const s = await startServer();
  await init(s.client);
  process.env.AGENTBOARD_DB = s.dbFile;
  const projectId = seedProject("MCP Test Board").id;
  return { client: s.client, close: () => s.client.close(), projectId };
}

async function callTool(client: McpClient, name: string, args: Record<string, unknown> = {}) {
  return client.call("tools/call", { name, arguments: args });
}

test("tools/list exposes the seven board tools", async () => {
  const { client, close } = await fresh();
  try {
    const res = await client.call("tools/list");
    const names = (res.result.tools as { name: string }[]).map((t) => t.name);
    for (const n of ["list_projects", "get_board", "create_task", "update_task", "move_task", "claim_task", "release_task"]) {
      assert.ok(names.includes(n), "missing tool " + n);
    }
  } finally { await close(); }
});

test("happy path: create, claim, move, release", async () => {
  const { client, close, projectId } = await fresh();
  try {
    const projects = parseText(await callTool(client, "list_projects"));
    assert.equal(projects.projects.length, 1);

    const created = parseText(await callTool(client, "create_task", { project_id: projectId, title: "First task", priority: 2 }));
    assert.equal(created.card.status, "todo");
    assert.equal(created.card.priority, 2);
    const taskId = created.card.id;

    const board = parseText(await callTool(client, "get_board", { project_id: projectId }));
    assert.equal(board.cards.length, 1);

    const claim = parseText(await callTool(client, "claim_task", { task_id: taskId, session: "agent-1", agent: "codex" }));
    assert.ok(claim.ok);
    assert.equal(claim.card.status, "in_progress");
    assert.equal(claim.card.assignee, "agent-1");

    const claim2 = parseText(await callTool(client, "claim_task", { task_id: taskId, session: "agent-2" }));
    assert.ok(!claim2.ok);

    const moveBad = parseText(await callTool(client, "move_task", { task_id: taskId, status: "not_a_column" }));
    assert.ok(!moveBad.ok);

    const release = parseText(await callTool(client, "release_task", { task_id: taskId }));
    assert.ok(release.ok);
    assert.equal(release.card.status, "todo");
    assert.equal(release.card.assignee, null);

    const move = parseText(await callTool(client, "move_task", { task_id: taskId, status: "in_progress" }));
    assert.ok(move.ok);
    const move2 = parseText(await callTool(client, "move_task", { task_id: taskId, status: "in_review" }));
    assert.ok(move2.ok);
    const move3 = parseText(await callTool(client, "move_task", { task_id: taskId, status: "done" }));
    assert.ok(move3.ok);
  } finally { await close(); }
});

test("WIP limit blocks moving into a full column", async () => {
  const { client, close, projectId } = await fresh();
  try {
    for (let i = 0; i < 3; i++) {
      const made = parseText(await callTool(client, "create_task", { project_id: projectId, title: "t" + i }));
      const claimed = parseText(await callTool(client, "claim_task", { task_id: made.card.id, session: "a" + i }));
      assert.ok(claimed.ok);
    }
    const extra = parseText(await callTool(client, "create_task", { project_id: projectId, title: "t-extra" }));
    const attempt = parseText(await callTool(client, "move_task", { task_id: extra.card.id, status: "in_progress" }));
    assert.ok(!attempt.ok);
    assert.match(String(attempt.error), /WIP limit/i);
  } finally { await close(); }
});

test("validation and unknown ids produce clean errors", async () => {
  const { client, close } = await fresh();
  try {
    const badProj = parseText(await callTool(client, "get_board", { project_id: "nope" }));
    assert.ok(isError(badProj) || badProj.error);

    const badTask = parseText(await callTool(client, "update_task", { task_id: "nope", title: "x" }));
    assert.ok(!badTask.ok);

    const badClaim = parseText(await callTool(client, "claim_task", { task_id: "nope", session: "a" }));
    assert.ok(!badClaim.ok);
  } finally { await close(); }
});
