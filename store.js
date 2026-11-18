// Shared state for the Threefold Cord icebreaker.
//
// Two modes, chosen automatically:
//  - LOCAL (default): state lives in this browser's localStorage.
//    Works for previewing/editing. Devices do NOT sync with each other.
//  - FIREBASE: if window.FIREBASE_CONFIG is filled in (see firebase-config.js),
//    state lives in one Firestore document and every phone syncs live.
//
// Public API (used by index.html and admin/index.html):
//   Store.init(onReady)            — call once; onReady fires when state is loaded
//   Store.getState()               — { presentIds: [id..], questions: [{id, askerId, targetId, text, createdAt}] }
//   Store.setAttendance(id, bool)
//   Store.submitQuestion(askerId, targetId, text) -> { ok } or { ok:false, error }
//   Store.updateQuestion(id, text)
//   Store.deleteQuestion(id)
//   Store.subscribe(cb)            — cb() runs whenever state changes
(function () {
  var LS_KEY = "threecord_state_v1";
  var listeners = [];
  var state = { presentIds: [], questions: [] };
  var backend = "local";
  var db = null;
  var docRef = null;

  function notify() { listeners.forEach(function (cb) { try { cb(); } catch (e) {} }); }

  // ---------- local backend ----------
  function localLoad() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) state = JSON.parse(raw);
    } catch (e) {}
  }
  function localSave() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    notify();
  }

  // ---------- firebase backend ----------
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function firebaseInit(onReady) {
    var base = "https://www.gstatic.com/firebasejs/10.12.2/";
    loadScript(base + "firebase-app-compat.js")
      .then(function () { return loadScript(base + "firebase-firestore-compat.js"); })
      .then(function () {
        firebase.initializeApp(window.FIREBASE_CONFIG);
        db = firebase.firestore();
        docRef = db.collection("threecord").doc("main");
        backend = "firebase";
        docRef.onSnapshot(function (snap) {
          if (snap.exists) {
            var d = snap.data();
            state = { presentIds: d.presentIds || [], questions: d.questions || [] };
          } else {
            docRef.set(state);
          }
          notify();
          if (onReady) { onReady(); onReady = null; }
        }, function () { if (onReady) { onReady(); onReady = null; } });
      })
      .catch(function () { backend = "local"; localLoad(); notify(); if (onReady) onReady(); });
  }
  function firebaseSave() {
    if (docRef) docRef.set(state);
    notify();
  }

  function save() { backend === "firebase" ? firebaseSave() : localSave(); }

  window.Store = {
    mode: function () { return backend; },
    init: function (onReady) {
      window.addEventListener("storage", function (e) {
        if (backend === "local" && e.key === LS_KEY) { localLoad(); notify(); }
      });
      if (window.FIREBASE_CONFIG) firebaseInit(onReady);
      else { localLoad(); notify(); if (onReady) onReady(); }
    },
    subscribe: function (cb) { listeners.push(cb); },
    getState: function () { return state; },
    setAttendance: function (id, present) {
      var i = state.presentIds.indexOf(id);
      if (present && i === -1) state.presentIds.push(id);
      if (!present && i !== -1) state.presentIds.splice(i, 1);
      save();
    },
    // The asker is never identified — no name/couple is collected anywhere.
    // askerKey is a random per-device token (see index.html), used only to
    // enforce one question per couple (one per device) and never displayed.
    submitQuestion: function (askerKey, targetId, text) {
      if (state.presentIds.indexOf(targetId) === -1)
        return { ok: false, error: "질문을 보낼 부부가 아직 체크인되지 않았습니다." };
      if (state.questions.some(function (q) { return q.askerId === askerKey; }))
        return { ok: false, error: "이미 질문을 보내셨습니다. 부부당 하나의 질문만 보낼 수 있습니다." };
      text = (text || "").trim();
      if (!text) return { ok: false, error: "질문을 입력해 주세요." };
      state.questions.push({
        id: "q" + Date.now() + Math.floor(Math.random() * 1000),
        askerId: askerKey, targetId: targetId, text: text, createdAt: Date.now()
      });
      save();
      return { ok: true };
    },
    updateQuestion: function (id, text) {
      var q = state.questions.find(function (x) { return x.id === id; });
      if (q) { q.text = (text || "").trim(); save(); }
    },
    deleteQuestion: function (id) {
      state.questions = state.questions.filter(function (x) { return x.id !== id; });
      save();
    }
  };
})();
