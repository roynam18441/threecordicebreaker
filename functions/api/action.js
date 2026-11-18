// POST /api/action — applies one change to the shared state in D1 and
// returns { ok, state } or { ok: false, error }.
// Body: { type: "attendance", coupleId, present }
//       { type: "submit", askerKey, targetId, text }
//       { type: "update", questionId, text }
//       { type: "delete", questionId }
// The same rules as the client store, enforced server-side so every device
// shares one truth. The asker is anonymous: askerKey is a random per-device
// token, never displayed.
import { readState, writeState } from "./_db.js";

function fail(error) {
  return Response.json({ ok: false, error }, { headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return fail("D1 binding DB is not configured.");
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return fail("잘못된 요청입니다.");
  }
  const state = await readState(env);

  if (body.type === "attendance") {
    const id = String(body.coupleId || "");
    const set = new Set(state.presentIds);
    if (body.present) set.add(id); else set.delete(id);
    state.presentIds = [...set];
  } else if (body.type === "submit") {
    const askerKey = String(body.askerKey || "");
    const targetId = String(body.targetId || "");
    const text = String(body.text || "").trim();
    if (!askerKey) return fail("오류가 발생했습니다. 다시 시도해 주세요.");
    if (!state.presentIds.includes(targetId)) return fail("참석이 확인된 부부에게만 질문할 수 있습니다.");
    if (!text) return fail("질문을 입력해 주세요.");
    if (state.questions.some((q) => q.askerId === askerKey)) return fail("이미 질문을 보내셨습니다.");
    state.questions.push({
      id: "q-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      askerId: askerKey,
      targetId,
      text,
      createdAt: Date.now()
    });
  } else if (body.type === "update") {
    const text = String(body.text || "").trim();
    if (!text) return fail("질문을 입력해 주세요.");
    const q = state.questions.find((x) => x.id === body.questionId);
    if (!q) return fail("질문을 찾을 수 없습니다.");
    q.text = text;
  } else if (body.type === "delete") {
    state.questions = state.questions.filter((x) => x.id !== body.questionId);
  } else {
    return fail("알 수 없는 요청입니다.");
  }

  await writeState(env, state);
  return Response.json({ ok: true, state }, { headers: { "Cache-Control": "no-store" } });
}
