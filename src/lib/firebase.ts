import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

// Firebase config is read from Vite env vars (see .env.example). These values
// are NOT secret — a Firebase web config is meant to ship to the browser; data
// is protected by Firestore security rules, not by hiding these keys.
//
// If the config is missing (e.g. before the Firebase project is set up), the
// app gracefully falls back to the Phase-1 localStorage data layer, so the
// dashboard keeps working offline and on first run.

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

// Initialize Firestore with IndexedDB offline persistence so the wall keeps
// showing the last-known data through wifi blips and across page reloads. The
// multi-tab manager lets the display and /admin share one cache safely. If the
// browser can't support persistence (private mode, old engine), fall back to
// the default in-memory client rather than crashing.
function initDb(): Firestore | null {
  if (!firebaseEnabled) return null;
  const app = initializeApp(config);
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (err) {
    console.warn('[mkt-dashboard] Firestore offline persistence unavailable, using in-memory cache', err);
    return getFirestore(app);
  }
}

export const db: Firestore | null = initDb();

// Single shared document holding the whole dashboard state. One doc keeps the
// model identical to the in-memory shape and gives instant onSnapshot updates
// across every device viewing the wall or the /admin portal.
export const DASHBOARD_COLLECTION = 'dashboards';
export const DASHBOARD_DOC = 'main';
