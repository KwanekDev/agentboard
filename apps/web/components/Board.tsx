"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

interface ColumnDef { id: string; name: string; wipLimit: number | null }
interface Card {
  id: string; projectId: string; title: string; description: string | null;
  status: string; priority: number; assignee: string | null; agent: string | null;
  error: string | null; createdAt: string; updatedAt: string
}
interface Project { id: string; name: string; columns: ColumnDef[]; createdAt: string }
interface BoardData { project: Project; cards: Card[] }

const PRIORITY_CLASS = ["p-low", "p-normal", "p-high"];
const PRIORITY_LABEL = ["low", "normal", "high"];

async function handle<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? "HTTP " + res.status);
  return json as T;
}

export default function Board() {
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 4000);
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    try {
      const res = await fetch("/api/projects/" + projectId);
      const board = await handle<BoardData>(res);
      setData(board);
    } catch (e) {
      showNotice((e as Error).message);
    }
  }, [showNotice]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/projects");
        const { projects } = await handle<{ projects: Project[] }>(res);
        let projectId = projects[0]?.id;
        if (!projectId) {
          const createdRes = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "My AI Project" })
          });
          const created = await handle<{ project: Project }>(createdRes);
          projectId = created.project.id;
        }
        if (!cancelled && projectId) await loadProject(projectId);
      } catch (e) {
        if (!cancelled) showNotice((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadProject, showNotice]);

  useEffect(() => {
    if (!data) return;
    const t = setInterval(() => { void loadProject(data.project.id); }, 5000);
    return () => clearInterval(t);
  }, [data, loadProject]);

  async function addCard(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !data) return;
    try {
      const res = await fetch("/api/projects/" + data.project.id + "/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, priority })
      });
      await handle(res);
      setTitle(""); setDescription(""); setPriority(1);
      await loadProject(data.project.id);
    } catch (err) {
      showNotice((err as Error).message);
    }
  }

  async function moveCard(cardId: string, status: string) {
    if (!data) return;
    try {
      const res = await fetch("/api/cards/" + cardId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      await handle(res);
      await loadProject(data.project.id);
    } catch (err) {
      showNotice((err as Error).message);
    }
  }

  if (loading) return <div className="board-app"><p className="board-app__main">Loading board…</p></div>;

  return (
    <div className="board-app">
      <div className="board-app__bar">
        <div className="wrap">
          <a className="nav__logo" href="/">
            <span className="mark mark--initial" aria-hidden="true">A</span>
            AgentBoard
          </a>
          <span className="t-small muted" style={{ marginLeft: "auto" }}>{data?.project.name ?? "Board"}</span>
        </div>
      </div>
      <main className="board-app__main">
        {notice && <div className="board-app__notice" role="status">{notice}</div>}

        <form id="app-form" onSubmit={addCard}>
          <div className="field">
            <label htmlFor="new-title">Task</label>
            <input
              id="new-title"
              type="text"
              placeholder="e.g. Implement OAuth refresh flow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="new-desc">Notes</label>
            <input
              id="new-desc"
              type="text"
              placeholder="Description or acceptance criteria (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="new-priority">Priority</label>
            <select id="new-priority" value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
              <option value={0}>Low</option>
              <option value={1}>Normal</option>
              <option value={2}>High</option>
            </select>
          </div>
          <button className="btn btn--primary" type="submit" disabled={!title.trim()}>Add card</button>
        </form>

        <div className="board-app__cols">
          {data?.project.columns.map((col, colIndex) => {
            const cards = data.cards.filter((c) => c.status === col.id);
            const isFull = col.wipLimit != null && cards.length >= col.wipLimit;
            const prev = data.project.columns[colIndex - 1];
            const next = data.project.columns[colIndex + 1];
            return (
              <section
                key={col.id}
                className={"board-app__col" + (isFull ? " at-limit" : "")}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (draggingId) void moveCard(draggingId, col.id); }}
                aria-label={col.name}
              >
                <header className="board-app__col-head">
                  <span>{col.name}</span>
                  <span className="board-app__wip">{cards.length}{col.wipLimit != null ? " / " + col.wipLimit : ""}</span>
                </header>
                <div className="board-app__cards">
                  {cards.map((card) => (
                    <article
                      key={card.id}
                      className={"board-app__card" + (draggingId === card.id ? " dragging" : "")}
                      draggable
                      onDragStart={() => setDraggingId(card.id)}
                      onDragEnd={() => setDraggingId(null)}
                    >
                      <div className="board-app__card-top">
                        <span className={"board-app__dot " + (PRIORITY_CLASS[card.priority] ?? "p-low")} title={PRIORITY_LABEL[card.priority] ?? "low"} />
                        <span className="board-app__title">{card.title}</span>
                      </div>
                      {card.description && <p className="board-app__desc">{card.description}</p>}
                      {(card.assignee || card.error) && (
                        <div className="board-app__meta">
                          {card.assignee && (
                            <span className="board-app__chip">{card.agent ? "🤖 " : "👤 "}{card.assignee}</span>
                          )}
                          {card.error && <span className="board-app__chip err">{card.error}</span>}
                        </div>
                      )}
                      <div className="board-app__actions">
                        {prev && <button className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => void moveCard(card.id, prev.id)} aria-label={"Move left to " + prev.name}>←</button>}
                        {next && <button className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => void moveCard(card.id, next.id)} aria-label={"Move right to " + next.name}>→</button>}
                      </div>
                    </article>
                  ))}
                  {cards.length === 0 && <p className="t-small muted">No tasks</p>}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

