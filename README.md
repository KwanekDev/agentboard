# AgentBoard

Open-source kanban board where people plan and AI agents execute.

You drop a task on the board, and an agent (Claude Code, Codex, Cursor…) reads the board over MCP, picks up the task, works on it and moves it to In Review. You review it, then move it to Done.

## Features

- Kanban board: Backlog → To Do → In Progress → In Review → Done
- WIP limits enforced on the server
- Atomic claims — two agents can never pick up the same task
- REST API + MCP server for agents
- SQLite (node:sqlite), zero external services

## Getting started

    pnpm install
    pnpm --filter web dev   # http://localhost:3000

## Connect an agent (MCP)

    claude mcp add agentboard -- node --import tsx /path/to/agentboard/packages/mcp/src/index.ts

Then tell your agent: "Check the board and pick up the highest-priority task in To Do."

## Repositories

- **KwanekDev/agentboard** — the board tool itself: kanban engine, packages (`packages/core`, `packages/mcp`), API, everything self-hosted.
- **KwanekDev/AgentBoard-Platform** — the web/cloud frontend: landing page, login, web/cloud version, marketing assets and the product panel.

## Structure

    packages/core/  # types + SQLite
    packages/mcp/  # MCP server
    apps/web/      # UI (Next.js) + REST API

## License

MIT © 2026 AgentBoard contributors

