// Threefold Cord icebreaker — data store.
// Backends, in priority order:
//   1. cloudflare — same-origin Pages Functions + D1 (/api/state, /api/action).
//      Used automatically when the site is served from Cloudflare and the DB
//      binding exists. Every device shares one state; clients poll every 4s.
//   2. firebase — if firebase-config.js has a config, Firestore live sync.
//   3. local — localStorage on this device only (GitHub Pages without a
//      backend, or plain file preview). Devices do NOT sync in this mode.
// Shared state shape: { presentIds: [coupleId..], questions: [{id, askerId, targetId, text, createdAt}] }
// The asker is anonymous: askerId is a random per-device token, never shown.
(function () {
  const LS_KEY = "threecord_state_v1";
  const LS_DEVICE = "threecord_device_key";
  let backend = "local";
  let state = { presentIds: [], questions: [] };
  const listeners = [];
  let lastWriteAt = 0;

  function deviceKey() {
    let k = localStorage.getItem(LS_DEVICE);
    if (!k) {
      k = "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(LS_DEVICE, k);
    }
    return k;
  }
  function notify() {
    listeners.forEach((fn) => { try { fn(); } catch (e) {} });
  }
  // Couple ids are numbers in couples.js; coerce any string ids ("1") coming
  // from a backend so includes() comparisons match.
  function normalize(s) {
    return {
      presentIds: (Array.isArray(s.presentIds) ? s.presentIds : []).map(Number).filter(Number.isFinite),
      questions: (Array.isArray(s.questions) ? s.questions : []).map((q) => ({ ...q, targetId: Number(q.targetId) }))
    };
  }
  function adoptState(next) {
    const a = JSON.stringify(state);
    state = normalize(next);
    if (a !== JSON.stringify(state)) notify();
  }
  // ---- local backend ----
  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) state = normalize(JSON.parse(raw));
    } catch (e) {}
  }
  function saveLocal() {
    if (backend === "local") {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    }
    notify();
  }
  // ---- firebase backend ----
  let fsDoc = null, fsSet = null;
  async function initFirebase(onReady) {
    try {
      const cfg = window.FIREBASE_CONFIG;
      if (!cfg) return false;
      const appMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const fsMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const app = appMod.initializeApp(cfg);
      const db = fsMod.getFirestore(app);
      fsDoc = fsMod.doc(db, "threecord", "main");
      fsSet = fsMod.setDoc;
      let first = true;
      fsMod.onSnapshot(fsDoc, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          state = normalize({ presentIds: d.presentIds || [], questions: d.questions || [] });
        }
        notify();
        if (first) { first = false; onReady(); }
      }, () => { if (first) { first = false; onReady(); } });
      return true;
    } catch (e) {
      return false;
    }
  }
  function saveFirebase() {
    if (fsDoc && fsSet) fsSet(fsDoc, state).catch(() => {});
    notify();
  }
  // ---- cloudflare backend ----
  async function cfFetchState() {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (!res.ok) throw new Error("api " + res.status);
    const data = await res.json();
    if (!data || !Array.isArray(data.presentIds) || !Array.isArray(data.questions)) {
      throw new Error("bad state");
    }
    return data;
  }
  async function initCloudflare(onReady) {
    try {
      const data = await cfFetchState();
      backend = "cloudflare";
      state = normalize(data);
      onReady();
      setInterval(async () => {
        if (Date.now() - lastWriteAt < 5000) return; // don't clobber fresh writes
        try { adoptState(await cfFetchState()); } catch (e) {}
      }, 4000);
      return true;
    } catch (e) {
      return false;
    }
  }
  function cfAction(payload) {
    lastWriteAt = Date.now();
    fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .then((res) => { if (res && res.state) adoptState(res.state); })
      .catch(() => {});
  }
  function persist() {
    if (backend === "firebase") saveFirebase();
    else saveLocal();
  }

  window.Store = {
    deviceKey,
    mode() { return backend; },
    async init(onReady) {
      if (await initCloudflare(onReady)) return;
      if (window.FIREBASE_CONFIG && (await initFirebase(onReady))) { backend = "firebase"; return; }
      backend = "local";
      loadLocal();
      onReady();
    },
    subscribe(fn) { listeners.push(fn); },
    getState() { return state; },
    myQuestion() {
      const k = deviceKey();
      return state.questions.find((q) => q.askerId === k) || null;
    },
    setAttendance(coupleId, present) {
      const set = new Set(state.presentIds);
      if (present) set.add(coupleId); else set.delete(coupleId);
      state.presentIds = [...set];
      if (backend === "cloudflare") { notify(); cfAction({ type: "attendance", coupleId, present }); }
      else persist();
    },
    submitQuestion(targetId, text) {
      targetId = Number(targetId);
      text = String(text == null ? "" : text).trim();
      if (!state.presentIds.includes(targetId)) return { ok: false, error: "참석이 확인된 부부에게만 질문할 수 있습니다." };
      if (!text) return { ok: false, error: "질문을 입력해 주세요." };
      if (this.myQuestion()) return { ok: false, error: "이미 질문을 보내셨습니다." };
      const q = {
        id: "q-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
        askerId: deviceKey(),
        targetId,
        text,
        createdAt: Date.now()
      };
      state.questions.push(q);
      if (backend === "cloudflare") { notify(); cfAction({ type: "submit", askerKey: deviceKey(), targetId, text }); }
      else persist();
      return { ok: true, question: q };
    },
    updateQuestion(id, text) {
      text = String(text == null ? "" : text).trim();
      if (!text) return { ok: false, error: "질문을 입력해 주세요." };
      const q = state.questions.find((x) => x.id === id);
      if (!q) return { ok: false, error: "질문을 찾을 수 없습니다." };
      q.text = text;
      if (backend === "cloudflare") { notify(); cfAction({ type: "update", questionId: id, text }); }
      else persist();
      return { ok: true };
    },
    deleteQuestion(id) {
      state.questions = state.questions.filter((x) => x.id !== id);
      if (backend === "cloudflare") { notify(); cfAction({ type: "delete", questionId: id }); }
      else persist();
    }
  };
})();
