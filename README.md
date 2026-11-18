# Threefold Cord (삼겹줄) Icebreaker

Anonymous icebreaker game for the NFC 삼겹줄 young married couples meeting
(first meeting: Sat Nov 21, 2026, 선교관).

Attendees see the couples who are checked in as present — with how each
couple first met — tap one couple, and send them **one anonymous icebreaker
question**. Nobody is asked to identify themselves: the asking couple is
never named, selected, or displayed anywhere. The host moderates from a
separate admin page. All on-screen instructions are in Korean.

## Pages

| Page | Path |
| --- | --- |
| Main (attendees) | `/` |
| Admin (host only, not linked from main) | `/admin/` |

## How it works

- **Attendance first.** Nobody is present by default. The host checks couples
  in on the admin page; only present couples appear on phones and can be asked.
- **One question per phone.** Enforced by a random per-device token (no
  identity is collected). After sending, the sender sees their question and a
  thank-you state instead of the form, and can return to the home view to see
  who has checked in. If the host deletes their question, they can ask again.
- **Anonymous.** There is no "who are we" picker at all. The admin question
  list shows only the target couple, the question text, and the time —
  never who asked.
- **Admin moderation.** Edit (inline) or delete any question on the admin page.

## Shared database on Cloudflare (D1) — for cross-device sync

Static hosting alone cannot share state between phones. On Cloudflare the
site runs as a **Worker + D1**:

- `worker.js` — serves the static files and the API:
  `GET /api/state` returns the shared state; `POST /api/action` applies one
  change (attendance / submit / update / delete) with the game rules
  enforced server-side.
- The state is one JSON document in a single-row D1 table (`app_state`,
  see `schema.sql`). The table is created automatically on first use.
- `wrangler.jsonc` — Worker name/config; static assets are the repo root.
- `store.js` detects `/api/state` on load and switches to **cloudflare
  mode**: every device reads/writes the shared D1 state and polls every
  4 seconds, so check-ins and questions appear on all phones.

### One-time setup (Cloudflare dashboard)

1. **Create the database:** Storage & Databases → **D1 SQLite Database** →
   Create database → name it `threecord-db`.
2. **Bind it to the Worker:** Workers & Pages → `threecordicebreaker` →
   **Bindings → Add a binding → D1 database** →
   Variable name: `DB` → select `threecord-db` → Deploy.
3. **Redeploy:** push any commit (or Deployments → Retry deployment) so the
   binding and the latest code take effect.
4. **Verify:** open the admin page — the mode line should read
   **실시간 동기화**. Check a couple in on one device; a second device shows
   them within ~5 seconds.

Until the binding exists, `/api` returns an error and the app quietly falls
back to local mode on each device — nothing breaks, it just doesn't sync.

### Alternative backend: Firebase

If the site is ever hosted somewhere without D1, `store.js` can instead use
Firestore: create a Firebase project + Firestore (test mode), paste the
`firebaseConfig` into `firebase-config.js` (steps in that file), and it
switches automatically. Cloudflare mode takes priority when both exist.

## Editing

- **Couples list / how-they-met:** `couples.js` (verbatim from the signup sheet)
- **Wording / layout:** `index.html` (main), `admin/index.html` (admin)
- **Look:** `styles.css` — deliberately simple: no hero, no header/footer
- **Rules (one-per-phone, present-only, anonymity):** `store.js` (client) and
  `worker.js` (server)
