import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

async function loadFirebaseConfig() {
  if (window.__FIREBASE_CONFIG__) {
    return window.__FIREBASE_CONFIG__;
  }

  try {
    const response = await fetch("/api/firebase-config", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Local static hosting without API route can still use firebase-runtime-config.js.
  }

  throw new Error(
    "Firebase config missing. Add firebase-runtime-config.js locally or set Vercel env vars for /api/firebase-config."
  );
}

const firebaseConfig = await loadFirebaseConfig();

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Keep users signed in between app restarts on the same device.
try {
  await setPersistence(auth, browserLocalPersistence);
} catch {
  // Some browsers/private modes can block local storage.
  await setPersistence(auth, browserSessionPersistence);
}

export const authReady = auth.authStateReady ? auth.authStateReady() : Promise.resolve();
export const db = getFirestore(app);
