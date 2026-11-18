// Shared D1 helpers for the /api functions. The leading underscore keeps
// Cloudflare Pages from treating this file as a route.
// State shape: { presentIds: [coupleId..], questions: [{id, askerId, targetId, text, createdAt}] }
// Stored as one JSON document in a single-row table (app_state, id = 1).
export const DEFAULT_STATE = { presentIds: [], questions: [] };

const CREATE_SQL =
  "CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)";

export async function readState(env) {
  await env.DB.prepare(CREATE_SQL).run();
  const row = await env.DB.prepare("SELECT data FROM app_state WHERE id = 1").first();
  if (!row || !row.data) return { presentIds: [], questions: [] };
  try {
    const parsed = JSON.parse(row.data);
    return {
      presentIds: Array.isArray(parsed.presentIds) ? parsed.presentIds : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : []
    };
  } catch (e) {
    return { presentIds: [], questions: [] };
  }
}

export async function writeState(env, state) {
  await env.DB.prepare(CREATE_SQL).run();
  await env.DB.prepare("INSERT OR REPLACE INTO app_state (id, data) VALUES (1, ?)")
    .bind(JSON.stringify(state))
    .run();
}
