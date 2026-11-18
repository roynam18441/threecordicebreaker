// OPTIONAL — cross-device sync.
//
// By default the app runs in LOCAL mode: attendance and questions are stored
// in the browser (localStorage) of the device using it. That is fine for
// previewing the pages and editing the design, but phones will NOT see each
// other's check-ins or questions.
//
// For the live event (many phones, one shared state), fill in a free Firebase
// project's web config below. store.js detects a filled-in config and switches
// to Firestore automatically — no other code changes needed.
//
// Steps:
//  1. https://console.firebase.google.com → Add project (any name)
//  2. Build → Firestore Database → Create database (start in test mode)
//  3. Project settings → "Your apps" → Web app (</>) → register app
//  4. Copy the firebaseConfig object it shows you into the place below.
window.FIREBASE_CONFIG = null;
// window.FIREBASE_CONFIG = {
//   apiKey: "...",
//   authDomain: "...firebaseapp.com",
//   projectId: "...",
//   appId: "..."
// };
