// GET /api/state — returns the shared state { presentIds, questions } from D1.
// Requires a D1 binding named DB on the Pages project (see README).
import { readState } from "./_db.js";

export async function onRequestGet(context) {
  if (!context.env.DB) {
    return Response.json({ error: "D1 binding DB is not configured." }, { status: 500 });
  }
  const state = await readState(context.env);
  return Response.json(state, { headers: { "Cache-Control": "no-store" } });
}
