import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeTempDb } from "./helpers";
import { createProject, addCard, claimCard, moveCard, releaseCard, deleteCard, renameProject, deleteProject, getProject, getCard, closeDb } from "../src/index";

let cleanup: () => void = () => {};

before(() => {
  const t = makeTempDb();
  process.env.AGENTBOARD_DB = t.file;
  cleanup = t.cleanup;
});

after(() => {
  closeDb();
  cleanup();
});

test("claimCard respects the WIP limit on In Progress", () => {
  const p = createProject("T");
  for (let i = 0; i < 3; i++) {
    const card = addCard(p.id, { title: "t" + i });
    const res = claimCard(card.id, "a" + i);
    assert.ok(res.ok, JSON.stringify(res));
  }
  const extra = addCard(p.id, { title: "extra" });
  const res = claimCard(extra.id, "x");
  assert.equal(res.ok, false);
  assert.match(String(res.error), /WIP limit/i);
  assert.equal(getCard(extra.id)?.status, "todo");
});

test("claimCard succeeds once capacity frees up", () => {
  const p = createProject("T2");
  const ids: string[] = [];
  for (let i = 0; i < 3; i++) {
    const card = addCard(p.id, { title: "t" + i });
    assert.ok(claimCard(card.id, "a" + i).ok);
    ids.push(card.id);
  }
  assert.ok(releaseCard(ids[0]).ok);
  const extra = addCard(p.id, { title: "extra" });
  const res = claimCard(extra.id, "x");
  assert.ok(res.ok, JSON.stringify(res));
  assert.equal(getCard(extra.id)?.status, "in_progress");
});

test("moveCard enforces WIP and leaves card unmoved on failure", () => {
  const p = createProject("T3");
  const a = addCard(p.id, { title: "a" });
  const b = addCard(p.id, { title: "b" });
  const c = addCard(p.id, { title: "c" });
  assert.ok(moveCard(a.id, "in_progress").ok);
  assert.ok(moveCard(b.id, "in_progress").ok);
  assert.ok(moveCard(c.id, "in_progress").ok);
  const d = addCard(p.id, { title: "d" });
  const res = moveCard(d.id, "in_progress");
  assert.equal(res.ok, false);
  assert.match(String(res.error), /WIP limit/i);
  assert.equal(getCard(d.id)?.status, "todo");
});

test("releaseCard returns task not found for a missing card", () => {
  const res = releaseCard("does-not-exist");
  assert.equal(res.ok, false);
  assert.equal(res.error, "task not found");
});

test("claim/move/release return task not found for missing ids", () => {
  assert.equal(claimCard("nope", "s").error, "task not found");
  assert.equal(moveCard("nope", "done").error, "task not found");
  assert.equal(releaseCard("nope").error, "task not found");
});



test("deleteCard removes a card in any state", () => {
  const p = createProject("Del");
  const todo = addCard(p.id, { title: "todo" });
  const done = addCard(p.id, { title: "done" });
  assert.ok(moveCard(done.id, "done").ok);
  assert.ok(deleteCard(todo.id).ok);
  assert.equal(getCard(todo.id), null);
  assert.ok(deleteCard(done.id).ok);
  assert.equal(getCard(done.id), null);
});

test("deleteCard removes a claimed card and frees the slot", () => {
  const p = createProject("Del2");
  const card = addCard(p.id, { title: "work" });
  assert.ok(claimCard(card.id, "agent-1").ok);
  const res = deleteCard(card.id);
  assert.ok(res.ok, JSON.stringify(res));
  assert.equal(getCard(card.id), null);
  // capacity is freed: a new card can be claimed
  const next = addCard(p.id, { title: "next" });
  assert.ok(claimCard(next.id, "agent-1").ok);
});

test("deleteCard returns task not found for missing id", () => {
  const res = deleteCard("does-not-exist");
  assert.equal(res.ok, false);
  assert.equal(res.error, "task not found");
});




test("renameProject updates name and rejects missing", () => {
  const p = createProject("Old");
  const res = renameProject(p.id, "  New Name  ");
  assert.ok(res.ok, JSON.stringify(res));
  assert.equal(res.project?.name, "New Name");
  const bad = renameProject("nope", "X");
  assert.equal(bad.ok, false);
  const empty = renameProject(p.id, "   ");
  assert.equal(empty.ok, false);
});

test("deleteProject removes project and its cards", () => {
  const p = createProject("Doomed");
  const card = addCard(p.id, { title: "x" });
  assert.ok(deleteProject(p.id).ok);
  assert.equal(getProject(p.id), null);
  assert.equal(getCard(card.id), null);
  const bad = deleteProject("nope");
  assert.equal(bad.ok, false);
});


