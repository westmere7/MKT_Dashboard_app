# Firebase setup — connect the dashboard across devices

This makes the `/admin` config page update the TV (and any other screen) **live, across
devices**. It's free for our usage and takes about 10 minutes. You only do this once.

Until you finish these steps the app still runs fine — it just saves changes on the
local browser only (the `/admin` page tells you which mode you're in).

---

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com/> and sign in with a Google account.
2. Click **Add project** (or **Create a project**).
3. Name it e.g. `mkt-dashboard`. Click **Continue**.
4. **Google Analytics** — toggle it **off** (we don't need it). Click **Create project**.
5. Wait for it to finish, then click **Continue**.

## 2. Create the Firestore database

1. In the left sidebar, open **Build → Firestore Database**.
2. Click **Create database**.
3. Choose a location close to you (e.g. `asia-southeast1` for Singapore). Click **Next**.
4. Select **Start in production mode** (we'll paste our own rules next). Click **Create**.

## 3. Paste the security rules

1. Still in **Firestore Database**, open the **Rules** tab.
2. Delete everything in the editor and paste the entire contents of the
   [`firestore.rules`](firestore.rules) file from this project.
3. Click **Publish**.

> These rules allow open read/write to the single dashboard document only — matching
> the current "no login" phase. When we add logins later, we tighten one line.

## 4. Register a web app and get the config

1. Click the **gear icon** (top-left, next to "Project Overview") → **Project settings**.
2. Scroll to **Your apps** and click the **web icon** `</>`.
3. Nickname it `mkt-dashboard-web`. **Do not** check "Firebase Hosting". Click **Register app**.
4. Firebase shows a `firebaseConfig` object like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "mkt-dashboard.firebaseapp.com",
     projectId: "mkt-dashboard",
     storageBucket: "mkt-dashboard.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123",
   };
   ```

5. Keep this tab open — you'll copy these six values in the next step.

## 5. Add the config to the app

1. In the project folder, copy `.env.example` to a new file named **`.env.local`**.
2. Paste each value from `firebaseConfig` after the matching `=` sign (no quotes):

   ```
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=mkt-dashboard.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=mkt-dashboard
   VITE_FIREBASE_STORAGE_BUCKET=mkt-dashboard.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
   ```

3. Save the file.

> These values are not secret — they're meant to ship to the browser. `.env.local` is
> git-ignored simply to keep each machine's config separate.

## 6. Restart and confirm

1. Stop the dev server if it's running, then start it again (`launch_server.bat`, or
   `npm run dev`). **Vite only reads `.env.local` at startup**, so a restart is required.
2. Open <http://localhost:5173/admin>. The banner should now read
   **"📡 Live sync is on"**.
3. On first run the dashboard seeds itself with the demo content automatically.
4. Test it: open the dashboard on one device and `/admin` on another, make an edit and
   click Save — the dashboard updates within a second.

---

## Deploying (Netlify)

When you deploy to Netlify, add the same six `VITE_FIREBASE_*` variables under
**Site settings → Environment variables**, then trigger a redeploy. The build reads
them the same way.

## If something looks wrong

- **Banner still says "Live sync is off"** → `.env.local` is missing a value, or the dev
  server wasn't restarted after creating it.
- **Console shows "Missing or insufficient permissions"** → the rules in step 3 weren't
  published, or were pasted into the wrong project.
- **Edits don't appear on other screens** → check the browser console for
  `[mkt-dashboard] Firestore` errors; confirm all screens use the same `projectId`.
