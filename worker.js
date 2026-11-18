// Threefold Cord icebreaker — Cloudflare Worker.
// Serves the static site (env.ASSETS) and the shared-state API backed by D1:
//   GET  /api/state   -> { presentIds, questions }
//   POST /api/action  -> { type: attendance|submit|update|delete, ... }
//                        returns { ok, state } or { ok: false, error }
// Requires a D1 binding named DB (Worker → Settings → Bindings → Add → D1).
// State is one JSON document in a single-row table (app_state, id = 1),
// created automatically on first use. The asker is anonymous: askerKey is a
// random per-device token, never displayed.
const CREATE_SQL =
  "CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)";
const DEFAULT_STATE = { presentIds: [], questions: [] };

async function readState(env) {
  await env.DB.prepare(CREATE_SQL).run();
  const row = await env.DB.prepare("SELECT data FROM app_state WHERE id = 1").first();
  if (!row || !row.data) return { presentIds: [], questions: [] };
  try {
    const parsed = JSON.parse(row.data);
    // Couple ids are numbers in couples.js — normalize anything stored as
    // strings ("1") back to numbers so id comparisons match everywhere.
    return {
      presentIds: (Array.isArray(parsed.presentIds) ? parsed.presentIds : [])
        .map(Number)
        .filter(Number.isFinite),
      questions: (Array.isArray(parsed.questions) ? parsed.questions : [])
        .map((q) => ({ ...q, targetId: Number(q.targetId) }))
    };
  } catch (e) {
    return { presentIds: [], questions: [] };
  }
}

async function writeState(env, state) {
  await env.DB.prepare(CREATE_SQL).run();
  await env.DB.prepare("INSERT OR REPLACE INTO app_state (id, data) VALUES (1, ?)")
    .bind(JSON.stringify(state))
    .run();
}

function json(data, status) {
  return Response.json(data, { status: status || 200, headers: { "Cache-Control": "no-store" } });
}

async function handleAction(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "잘못된 요청입니다." });
  }
  const state = await readState(env);

  if (body.type === "attendance") {
    const id = Number(body.coupleId);
    if (!Number.isFinite(id)) return json({ ok: false, error: "잘못된 요청입니다." });
    const set = new Set(state.presentIds);
    if (body.present) set.add(id); else set.delete(id);
    state.presentIds = [...set];
  } else if (body.type === "submit") {
    const askerKey = String(body.askerKey || "");
    const targetId = Number(body.targetId);
    const text = String(body.text || "").trim();
    if (!askerKey) return json({ ok: false, error: "오류가 발생했습니다. 다시 시도해 주세요." });
    if (!state.presentIds.includes(targetId)) return json({ ok: false, error: "참석이 확인된 부부에게만 질문할 수 있습니다." });
    if (!text) return json({ ok: false, error: "질문을 입력해 주세요." });
    if (state.questions.some((q) => q.askerId === askerKey)) return json({ ok: false, error: "이미 질문을 보내셨습니다." });
    state.questions.push({
      id: "q-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      askerId: askerKey,
      targetId,
      text,
      createdAt: Date.now()
    });
  } else if (body.type === "update") {
    const text = String(body.text || "").trim();
    if (!text) return json({ ok: false, error: "질문을 입력해 주세요." });
    const q = state.questions.find((x) => x.id === body.questionId);
    if (!q) return json({ ok: false, error: "질문을 찾을 수 없습니다." });
    q.text = text;
  } else if (body.type === "delete") {
    state.questions = state.questions.filter((x) => x.id !== body.questionId);
  } else {
    return json({ ok: false, error: "알 수 없는 요청입니다." });
  }

  await writeState(env, state);
  return json({ ok: true, state });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/state" || url.pathname === "/api/action") {
      if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
      if (url.pathname === "/api/state") {
        if (request.method !== "GET") return json({ error: "method not allowed" }, 405);
        return json(await readState(env));
      }
      if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
      return handleAction(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
