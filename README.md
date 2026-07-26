# BlindAiGlass

An AI assistant for blind and visually impaired people. It uses your phone's
camera and AI to describe surroundings and give short spoken alerts.

> ⚠️ **Safety:** BlindAiGlass is an *extra* helper only. It is **not** a
> replacement for a white cane or guide dog. Do not rely on it to cross
> streets, detect stairs, or avoid hazards.

## What this is

A **web app** (PWA) — a website that behaves like an app. You test it by
opening a link in **Safari on your iPhone**. No App Store, no Mac needed.

## How to test it on your iPhone

The app must be served over **HTTPS** (the iPhone will not allow the camera
otherwise). We use free **GitHub Pages** hosting.

**One-time setup (in the GitHub website):**

1. Go to the repository → **Settings** → **Pages** (left sidebar).
2. Under **Source**, choose **Deploy from a branch**.
3. Pick the branch **`claude/ai-assistant-visually-impaired-ukk9t2`** and folder **`/ (root)`**.
4. Click **Save** and wait about a minute.

**Then, on your iPhone:**

1. Open **Safari** and go to: `https://ayashdan.github.io/BlindAiGlass/`
2. Tap the big **"Tap Anywhere to Start"** button.
3. When Safari asks, tap **Allow** for the camera.
4. You should see the camera picture and hear the welcome + safety message.

> Tip: For the best hands-free experience later, use **bone-conduction
> headphones** or leave one ear open, so you can still hear the world around you.

## Project files

| File | What it does |
|------|--------------|
| `index.html` | The page structure: the camera view, the big button, the status line. |
| `styles.css` | High-contrast, large-text, full-screen accessible styling. |
| `app.js` | The app logic: start camera, speak out loud, react to taps. |
| `manifest.webmanifest` | Lets the app be "installed" to the Home Screen like a real app. |

## Roadmap

- [x] **M0 + M1** — Accessible skeleton: camera preview + spoken welcome. **(you are here)**
- [ ] **M2** — Voice loop (listen + speak).
- [ ] **M3** — On-device object detection (person / chair / car …).
- [ ] **M4** — Smart spoken alerts ("Person ahead").
- [ ] **M5** — Answer simple questions from what the camera sees.
- [ ] **M6** — Cloud AI: "Describe my surroundings."
- [ ] **M7** — Polish, settings, real-user testing.
