# TV kiosk setup (Mac + browser)

How to run the dashboard full-screen and unattended on the Mac driving the TV.
Do this once on that machine.

The app already self-heals: it caches data offline (rides out wifi blips),
reloads itself every day at 4am, and recovers automatically from any render
error. These steps cover the parts the browser and OS control.

---

## 1. Stop the Mac (and screen) from sleeping

So the TV never blanks while the office is closed:

1. **System Settings → Displays → Advanced** → turn **"Prevent automatic sleeping
   on power adapter when the display is off"** on (wording varies by macOS).
2. **System Settings → Lock Screen** → set **"Turn display off…"** to **Never**
   (on power adapter), and **"Start Screen Saver when inactive"** to **Never**.
3. Belt-and-braces: open **Terminal** and run `caffeinate -dimsu &` — this keeps
   the display awake until reboot. To make it permanent, add it as a login item
   (step 4 covers auto-launch).

## 2. Open the dashboard full-screen (Chrome kiosk mode)

Use Chrome's true kiosk mode — no tabs, no address bar, no exit chrome:

```sh
open -a "Google Chrome" --args --kiosk --app="http://<dashboard-url>/"
```

- Replace `<dashboard-url>` with the live site (your Netlify URL) — or
  `http://localhost:5173` if you're running it locally on this Mac.
- Use the dashboard root `/`, **not** `/admin`.
- To exit kiosk mode: `Cmd+Q`.

> Edge and Safari also work. Safari: enter full screen with `Ctrl+Cmd+F` (it has
> no true kiosk flag, so this is slightly less locked-down than Chrome).

## 3. Hide the mouse cursor (optional)

Install [Cursorcerer](https://github.com/dpryden/Cursorcerer) or `brew install --cask hide-my-cursor`
to hide the idle pointer so it doesn't sit on screen.

## 4. Auto-launch on login (so it survives a power cut)

Create a tiny launcher script and add it to login items:

1. Save this as `~/launch-dashboard.command` and `chmod +x ~/launch-dashboard.command`:

   ```sh
   #!/bin/sh
   caffeinate -dimsu &
   sleep 5   # give wifi a moment to connect after boot
   open -a "Google Chrome" --args --kiosk --app="http://<dashboard-url>/"
   ```

2. **System Settings → General → Login Items & Extensions → Open at Login** →
   **+** → choose `launch-dashboard.command`.
3. Set the Mac to power on automatically after a power failure:
   **System Settings → Energy** → **"Start up automatically after a power failure"**.

Now a power cut or overnight reboot brings the wall back on its own.

---

## What recovers on its own (no action needed)

| Situation | What happens |
| --- | --- |
| Wifi drops briefly | Last-known data stays on screen; heartbeat dot turns red ("offline — last known"); reconnects automatically. |
| New content saved in /admin | Appears on the wall within ~1 second. |
| New version deployed | Picked up at the next 4am reload (or reload manually with `Cmd+R`). |
| A render glitch | Brief "Refreshing…" screen, then auto-reload after 15s. |
| Memory creep over days | Cleared by the daily 4am reload. |

## Reading the heartbeat (bottom-right of the wall)

- 🟢 **live** — connected, showing fresh data.
- 🟠 **connecting…** — starting up / reconnecting.
- 🔴 **offline — last known** — no connection; showing cached data. Check the wifi
  if it stays red.
