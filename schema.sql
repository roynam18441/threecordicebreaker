-- Threefold Cord icebreaker — Cloudflare D1 schema.
-- The whole shared state (attendance + questions) is one JSON document in a
-- single row, the same shape store.js uses everywhere. The Pages Functions
-- also create this table automatically on first use, so running this file is
-- optional — it is here so the database layout is visible/editable.
CREATE TABLE IF NOT EXISTS app_state (
  id   INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);
