# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multiplayer local quiz game inspired by the Brazilian board game "Perfil". Players guess an entity from up to 10 progressive clues. Supports up to 11 simultaneous players via LAN. The first player to join becomes the HOST, who controls game flow; all others are regular players.

## Architecture

This is a monorepo with two separate services that must both run concurrently:

- **`backend/`** — Bun + Elysia 1.x server on port **3001**. Handles all game logic, player sessions, and real-time events via native Bun WebSocket.
- **`frontend/`** — Next.js 15 App Router on port **3000**. Pure UI layer; all state comes from WebSocket events.

The frontend connects to `window.location.hostname:3001/ws`, so it automatically works on LAN when accessed by IP. No build-time config needed for LAN play.

## Development Commands

**Backend** (from `backend/`):
```bash
bun install
bun run dev        # watch mode
bun run start      # production
```

**Frontend** (from `frontend/`):
```bash
bun install
bun run dev        # Next.js with Turbopack
bun run build
bun run lint       # eslint
```

There are no test suites; verification is done by running the game manually.

## Backend Architecture

**Entry point:** `src/index.ts` — Elysia 1.x app (Bun-native) that handles:
- REST API at `/api/` for CRUD on disciplinas, temas, and cartas
- Native WebSocket at `/ws` (delegated to `src/ws.ts` via `wsHandlers`)
- `GET /health` and `GET /game-state` status endpoints

**Game state:** `src/game.ts` — `GerenciadorJogo` singleton (`gerenciadorJogo`) holds all runtime state in memory (player maps, current card, turn tracking) and syncs to SQLite via `src/db/queries.ts`. State persists across server restarts through `carregarSessaoAtiva()` on construction.

**Database:** SQLite at `data/quiz.db` via `better-sqlite3` (raw queries, not Drizzle ORM despite the dependency). Schema defined in `src/db/schema.ts`. Seeded on startup from `src/db/seed.ts`.

**WebSocket protocol** (all handled in `src/ws.ts`): All messages are JSON `{ event: string, data: any }`. On connect, server immediately sends `{ event: 'session-id', data: { id: UUID } }` to assign a stable socket ID. Connection tracking uses `connections: Map<UUID, ServerWebSocket>` and `wsToId: WeakMap` for reverse lookup. Helper functions: `broadcast`, `sendTo`, `broadcastExcept`.

- Client → Server: `join-lobby`, `request-game-state`, `roll-dice`, `set-play-order`, `select-theme`, `start-game`, `reveal-clue`, `pass-turn`, `submit-answer`, `validate-answer`, `reveal-answer`, `restart-game`, `exit-victory-screen`, `sair-lobby`
- Server → Client: `session-id`, `joined-lobby`, `lobby-state`, `player-joined`, `player-left`, `dice-rolled`, `play-order-set`, `theme-selected`, `game-started`, `clue-revealed`, `new-answer`, `answer-correct`, `answer-incorrect`, `answers-updated`, `next-card`, `answer-revealed`, `victory-state`, `game-ended`, `game-restarted`, `return-to-lobby`

**Scoring:** Cards start at 10 points. After the 2nd clue is revealed, points decrease by 1 per clue down to a floor of 1. Logic in `GerenciadorJogo.calcularPontos()`.

**Card source:** Cards are fetched from the DB by `temaId` if a theme is selected; otherwise fall back to the hardcoded `gameCards` array in `src/models.ts`.

**Input validation:** `src/schemas/jogo.schema.ts` — `validarNome`, `validarResposta`, `validarIndiceDica`, `validarCasas` validators used by `ws.ts` before processing events.

## Frontend Architecture

**Pages** (all in `frontend/app/`):
- `/` (`page.tsx`) — name entry screen, stores name in `localStorage`
- `/lobby` (`lobby/page.tsx`) — waiting room; HOST sees theme selector (disciplina → tema) and control buttons; players see dice roll
- `/game` (`game/page.tsx`) — main game screen; HOST view shows full card + clues + answer validation panel; player view shows revealed clues + answer input
- `/victory` (`victory/page.tsx`) — final ranking; HOST can restart or exit to lobby
- `/admin` (`admin/page.tsx`) — content management UI for disciplinas, temas, and cartas (CRUD via REST API)
- `/sobre` (`sobre/page.tsx`) — static about/landing page (not socket-driven); navigates to `/` directly

**`lib/cards.ts`:** Exports the `Card` interface and a `gameCards` fallback array (UX/UI-themed cards) used for TypeScript typing in `game/page.tsx`.

**`lib/config.ts`:** Exports a `GAME_CONFIG` object (max players, display timings, server URL) but is not currently imported anywhere — values are hardcoded inline where needed.

**Socket singleton:** `lib/socket.ts` — `getSocket()` returns a lazily-created `WsClient` instance (native WebSocket wrapper), connecting to `hostname:3001/ws`. The `WsClient` class mimics Socket.IO's `.on/.off/.emit` API. All messages are JSON `{ event, data }`. Session persistence uses a UUID in `localStorage` (`perfil_session_id`) sent as `?sessionId=` query param on connect; `'connect'` event fires only after the server sends `session-id` (so `socket.id` is populated before handlers run). Auto-reconnects up to 5 times with exponential backoff. `reativarOuAdicionarJogador` on the backend uses the session UUID to restore player state.

**Sound singleton:** `lib/soundManager.ts` — `soundManager` (exported instance) pre-loads all `HTMLAudioElement` objects at module evaluation time. Call `soundManager.play(name: SoundName)` or `soundManager.stop(name)` in client components. Guard against SSR is built-in. Sound files live in `public/sound/` (Next.js static serving requirement — `frontend/sound/` is unused). To add a new sound: copy the `.mp3` to `public/sound/`, add the name to `SoundName` and `SOUND_PATHS` in `soundManager.ts`. The singleton persists across Next.js navigations, so background/looping sounds must be stopped in the socket event handlers that trigger navigation (e.g. `return-to-lobby`, `game-restarted`), not only in the HOST's button handlers — otherwise non-host players keep hearing the sound after the page changes.

**`clue-revealed` dual purpose:** this event fires both when a clue is revealed AND when a turn is passed (with the same indices). Sound logic in `game/page.tsx` uses `revealedCluesCountRef` to distinguish: `newRevealed.length > count` → play `revealClue`; equal → play `passTurn`.

**Routing flow:** All navigation is driven by socket events; pages push routes reactively (e.g., `game-started` → router.push('/game'), `return-to-lobby` → router.push('/lobby')).

## Key Constraints

- Max 11 players per session (enforced in `GerenciadorJogo.adicionarJogador`).
- Each player may only reveal one clue per turn (`revelouEstaTurno` flag, persisted to DB).
- Only the HOST can: start game, validate answers, reveal answer, select theme, restart.
- `validate-answer` auto-calculates points server-side; the `casas` field is not sent by the client.
- Disconnects are soft (socket ID cleared, player kept in DB); `sair-lobby` is a hard remove.
