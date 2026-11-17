# AgentBoard — project rules

## Repositories (split)

- **`KwanekDev/agentboard`** — the public repo of the tool itself: the kanban board engine, packages (`packages/core`, `packages/mcp`), API and everything that runs self-hosted.
- **`KwanekDev/AgentBoard-Platform`** — the web/cloud frontend and everything around the platform: landing page, login, web/cloud version, marketing assets and the product panel.

Rule: **what is the board tool → `agentboard` (public); what is a page/cloud → `agentboard-platform`.** Do not mix zones: landing/cloud changes go to `agentboard-platform`, the board core goes to `agentboard`. Ambiguous cases (shared changes, new services) require user confirmation.

