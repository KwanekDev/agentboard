# AgentBoard

Open-source kanban board, w której ludzie planują, a agenci AI wykonują.

Wrzucasz zadanie na tablicę, a agent (Claude Code, Codex, Cursor...) czyta
tablicę przez MCP, podnosi zadanie, pracuje nad nim i przesuwa je do kolumny
In Review. Ty przeglądasz i dopiero wtedy przenosisz do Done.

## Funkcje

- Tablica Kanban: Backlog → To Do → In Progress → In Review → Done
- Limity WIP egzekwowane po stronie serwera
- Atomowe claim — dwa agenty nie złapią tego samego zadania
- REST API + serwer MCP dla agentów
- SQLite (node:sqlite), zero zewnętrznych usług

## Uruchomienie

    pnpm install
    pnpm --filter web dev   # http://localhost:3000

## Podłączenie agenta (MCP)

    claude mcp add agentboard -- node --import tsx /ścieżka/do/agentboard/packages/mcp/src/index.ts

Następnie powiedz agentowi: "Sprawdź tablicę i podnieś najwyższe zadanie z To Do".

## Struktura

    packages/core/  # typy + SQLite
    packages/mcp/  # serwer MCP
    apps/web/      # UI (Next.js) + REST API

## Licencja

MIT © 2026 AgentBoard contributors
