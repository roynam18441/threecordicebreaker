# Threefold Cord (삼겹줄) Icebreaker

Anonymous icebreaker game for the NFC 삼겹줄 young married couples meeting
(first meeting: Sat Nov 21, 2026, 선교관).

Attendees see the couples who are checked in as present — with how each
couple first met — tap one couple, and send them **one anonymous question**.
Nobody is asked to identify themselves: the asking couple is never named,
selected, or displayed anywhere. The host moderates from a separate
admin page. All on-screen instructions are in Korean.

## Pages

| Page | URL (GitHub Pages) |
| --- | --- |
| Main (attendees) | `https://roynam18441.github.io/threecordicebreaker/` |
| Admin (host only, not linked from main) | `https://roynam18441.github.io/threecordicebreaker/admin/` |

## Turn on the public site (one time)

Repo **Settings → Pages** → Build and deployment → Source:
**Deploy from a branch** → Branch: `main`, folder: `/ (root)` → Save.
The URLs above go live a minute later.

## How it works

- **Attendance first.** Nobody is present by default. The host checks couples
  in on the admin page; only present couples appear on phones, and only
  present couples can be asked or ask.
- **One question per couple.** Enforced in `store.js` by a random per-device
  token (no identity is collected, so in practice this is one question per
  phone). After sending, the couple sees their question and a thank-you
  state instead of the form. If the host deletes their question, they can
  ask again.
- **Anonymous.** There is no "who are we" picker at all. The admin question
  list shows only the target couple, the question text, and the time —
  never who asked.
- **Admin moderation.** Edit (inline) or delete any question on the admin page.

## Important: sync across phones

GitHub Pages is static hosting, so out of the box the app runs in **local
mode**: state is stored in each browser (localStorage). That is fine for
viewing and editing the pages, but attendees' phones will not see each
other's check-ins/questions.

For the live event, enable free cross-device sync:

1. Create a Firebase project and a Firestore database (test mode) —
   steps are written out in `firebase-config.js`.
2. Paste your `firebaseConfig` into `firebase-config.js` and push.

`store.js` then switches to Firestore automatically; every phone syncs live.
No other file changes are needed.

## Editing

- **Couples list / how-they-met:** `couples.js` (verbatim from the signup sheet)
- **Wording / layout:** `index.html` (main), `admin/index.html` (admin)
- **Look:** `styles.css` — deliberately simple: no hero, no header/footer
- **Rules (one-per-couple, present-only, anonymity):** `store.js`
