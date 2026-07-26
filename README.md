# BlindAiGlass

A quiet **AI walking guide** for blind and visually impaired people. As you
walk, it uses your phone's camera to warn you — in short spoken cues — about
people, vehicles, and obstacles nearby, when something is **approaching**, and
which side is **clearer**. It can also read printed text aloud on demand.

> 🚫 **It cannot see steps, stairs, curbs, or drop-offs** — a single phone
> camera can't sense depth reliably, and a wrong warning could cause a fall.
> Keep using your white cane or guide dog for footing. This app is an *extra*
> layer of information, never a replacement.

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

- [x] **M0 + M1** — Accessible skeleton: camera preview + spoken welcome.
- [x] **M3** — On-device object detection (person / chair / car …).
- [x] **M4** — Automatic spoken alerts with direction + rough distance.
- [x] **M4.1** — Choose the distance unit: **steps / feet / meters**. **(you are here)**
- [x] **M5** — Reader: read text out loud (menus, signs, labels). Runs **on the phone** with in-browser OCR — **no server, no API key, private**.
- [ ] **M6** — "Describe my surroundings" (rich scene description).
- [ ] **M7** — Directional guidance ("the door is on your left, turn left").
- [ ] **M8** — Polish, settings, real-user testing.

The app has three controls: the big **middle** area = "what do you see?",
the **📖 Read** button = read text aloud, and the **📏 Unit** button = switch
steps/feet/meters. The Reader downloads a small model the first time you use
it, then works offline. Nothing you photograph ever leaves your phone.

> Note: distances are **rough estimates** from how large objects appear on
> screen. A single phone camera cannot measure true distance — treat them as
> hints, never exact figures.
