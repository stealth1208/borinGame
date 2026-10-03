# Imposter

Mobile-first party game for a table of friends. One host creates a room, everyone else scans the **same QR code**, and each phone privately receives a role and secret word. Talking and accusing happen face to face.

Vietnamese UI. No accounts.

## How a round works

1. Host opens the site → **Tạo phòng**.
2. Host picks Classic Impostor or Undercover, then creates the room.
   - Nickname is now optional; if left blank, the host becomes "Anonymous".
   - Host can enable "Impostor biết nhau" to let impostors see each other's names.
3. Host screen shows a large QR encoding only `https://your-domain/r/{ROOMCODE}`.
4. Players scan that QR, optionally enter a nickname (or leave blank for "Anonymous"), and wait.
5. Host starts. The server assigns roles and words.
6. Each player holds to reveal **only their own** secret, then hides it.
   - Classic impostors now receive a **hint word** related to the category instead of null.
   - If "Impostor biết nhau" is enabled, impostors see their teammates' names.
   - The selected category/topic is visible on all player screens during the round.
7. Players describe the word out loud. Host starts discussion, then voting.
8. After votes, the Impostor/Undercover and words are revealed.
9. Host can start another round with the same people — no new QR scan.
   - Host can also **restart** the current round or **cancel** to return to lobby at any time.

## Room states

`LOBBY` → `ROLE_REVEAL` → `DISCUSSION` → `VOTING` → `RESULT` → next round or back to lobby.

Invalid jumps are rejected on the server. Only the host can change phase, remove a player, or close the room.

## Sessions

- Creating a room or joining writes an httpOnly cookie `imposter_sid`.
- Identity is the session token, not the nickname.
- Nicknames are now optional; empty nicknames get auto-assigned as "Anonymous", "Anonymous2", etc.
- Refreshing the same browser reconnects as the same player.
- A new browser / incognito session is a new player (acceptable for MVP).
- Duplicate nicknames in the same room are rejected.

## How secrets stay private

- Role assignments live in `player_assignments`, separate from `players`.
- `GET /api/rooms/{code}` returns names, counts, phase, speaking order, and (after reveal) public results. It never includes everyone’s words.
- `GET /api/rooms/{code}/me` returns **this session’s** role and word only, after the round has started.
- Realtime events are `{ type: "room.updated" }` pings. Clients refetch. Secrets are not broadcast.
- Host does not receive a full assignment dump before the result screen.

## Realtime

Postgres is the source of truth when Supabase is configured. The Next.js process emits Server-Sent Events so every client refetches after a mutation.

If `SUPABASE_SERVICE_ROLE_KEY` is unset, the app uses an **in-memory store** on the Node server. That is enough for a local party on one process. It does not survive multi-instance deploys or server restarts.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:43123](http://localhost:43123).

```bash
npm run typecheck
npm run lint
npm test
```

## Configure Supabase (optional)

1. Create a project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. Generate and run the word seed:

```bash
npx tsx supabase/generate-seed.ts
```

Then paste `supabase/seed.sql` into the SQL editor.

4. Put keys in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The service role key is **server only**. Do not expose it to the browser. With keys present, `getGameStore()` uses Postgres instead of memory.

Realtime on Supabase is optional extra notification; the app already refetches via SSE after every mutation.

## Architecture

```
src/
  app/                 routes and API
  domain/              types, transitions, assignment, voting, game service
  features/            UI for lobby, game, word packs
  lib/store/           memory + Supabase adapters
  lib/session/         httpOnly cookie
  lib/realtime/        in-process SSE bus
```

Domain functions take a `GameStore`. Tests use the memory store.

### MVP decisions

- Host is also a player (nickname on create, optional — defaults to "Anonymous").
- Max 12 players, min 3. Impostor count: 1 for 3–6 players, 1–2 for 7–10. Enforced in domain logic, not only UI.
- "Number of rounds" is stored but not auto-advanced; host taps **Ván tiếp**.
- Tie: show Hòa. Host may vote again or reveal anyway (finish voting already shows result including a tie).
- Rooms expire after 6 hours (`expiresAt`). No scheduled janitor in MVP.
- Host can **restart** the current round or **cancel** to return to lobby from any in-round phase (ROLE_REVEAL, DISCUSSION, VOTING, RESULT).
- Host can **close the room** at any time (LOBBY or during a round).
- Classic impostors receive a **hint word** related to the chosen category instead of null.
- The selected category/topic is visible to all players during the round (except when set to RANDOM).
- Optional setting: "Impostor biết nhau" — when enabled, impostors/undercovers see each other's names.

## API (session from cookie)

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/rooms` | create + host session |
| GET | `/api/rooms/{code}` | public lobby |
| POST | `/api/rooms/{code}/join` | player session |
| GET | `/api/rooms/{code}/me` | own secret |
| GET | `/api/rooms/{code}/events` | SSE |
| POST | `/api/rooms/{code}/start` | host |
| POST | `/api/rooms/{code}/discussion` | host |
| POST | `/api/rooms/{code}/voting` | host |
| POST | `/api/rooms/{code}/votes` | player |
| POST | `/api/rooms/{code}/finish-voting` | host |
| POST | `/api/rooms/{code}/next` | host |
| POST | `/api/rooms/{code}/lobby` | host |
| POST | `/api/rooms/{code}/remove` | host |
| POST | `/api/rooms/{code}/restart` | host (restart current round) |
| POST | `/api/rooms/{code}/close` | host (close room anytime) |
