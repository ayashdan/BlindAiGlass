/*
  app.js — the "brain" of BlindAiGlass.

  Milestones working so far:
   - M0/M1: tap to start, rear camera, spoken welcome + safety message.
   - M3: on-device object detection (~80 everyday objects), private + offline.
   - M4 (NEW): the app now talks on its OWN when something important is near.
       * DIRECTION: it says "on your left / ahead / on your right".
       * DISTANCE (rough): "very close / a few steps away / far" — estimated
         from how big the object looks. A phone camera cannot measure true
         distance, so this is an APPROXIMATE hint only, never a precise number.
       * DOESN'T CHATTER: it only speaks about important, nearby things, and
         won't repeat the same alert over and over.
       * Tapping still gives a full "what I see" summary on demand.

  Still to come:
   - M5/M6: reader (menus/signs), translator, and rich scene descriptions
     using cloud AI. Those need a small secure backend (see the roadmap).
*/

// ----- Page elements we control -----
const video = document.getElementById("camera");
const button = document.getElementById("mainButton");
const buttonText = document.getElementById("buttonText");
const statusEl = document.getElementById("status");

// ----- App state (little bits of memory) -----
let hasStarted = false;      // have we done the one-time startup yet?
let model = null;            // the loaded AI vision model (null until loaded)
let currentDetections = [];  // the most recent list of objects the camera sees
let isDetecting = false;     // guard so two detections don't run at once

// Memory for the automatic-alert system (M4):
let lastAlertAt = 0;             // when we last spoke an automatic alert
const alertHistory = new Map();  // remembers "what we said" -> "when", to avoid repeats

/*
  ----- Which objects are worth interrupting the user for -----
  Higher number = more important. Moving things (people, vehicles) matter most.
  Anything not listed here (bottle, cup, laptop, …) will NOT trigger an
  automatic alert — you'll still hear it if you tap to ask.
*/
const PRIORITY = {
  person: 3,
  car: 3, bus: 3, truck: 3, motorcycle: 3, bicycle: 3, train: 3,
  dog: 2, cat: 2,
  chair: 1, bench: 1, "potted plant": 1,
};
function priorityOf(cls) {
  return PRIORITY[cls] || 0;
}

/*
  speak(text, interrupt)
  Says something out loud using the phone's built-in voice.
  If interrupt is true, we stop whatever is being said first (used for urgent
  alerts). If false, we let the current sentence finish.
*/
function speak(text, interrupt = true) {
  if (!("speechSynthesis" in window)) return;
  if (interrupt) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

/*
  setStatus(text)
  Updates the text line at the top. VoiceOver also reads this (it's aria-live).
*/
function setStatus(text) {
  statusEl.textContent = text;
}

/*
  startCamera()
  Asks for the BACK camera and shows the live picture. true on success.
*/
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    return true;
  } catch (err) {
    console.error("Camera error:", err);
    return false;
  }
}

/*
  ----- Turning a detection's position/size into human words -----
  A detection's "bbox" is [x, y, width, height] in pixels:
   - x is how far from the LEFT edge the box starts.
   - width/height are the box size.
*/

// LEFT / AHEAD / RIGHT, based on where the middle of the object is across the frame.
function directionOf(pred, frameWidth) {
  const centerX = pred.bbox[0] + pred.bbox[2] / 2;
  const fraction = centerX / frameWidth; // 0 = far left, 1 = far right
  if (fraction < 0.34) return "on your left";
  if (fraction > 0.66) return "on your right";
  return "ahead";
}

/*
  closenessOf(pred, frameHeight)
  Rough distance from how TALL the object looks compared to the whole screen.
  Bigger on screen = closer. This is an estimate only.
  Returns a spoken label plus a "rank" (0 = closest) we can sort/threshold by.
*/
function closenessOf(pred, frameHeight) {
  const heightFraction = pred.bbox[3] / frameHeight;
  if (heightFraction >= 0.6) return { label: "very close", rank: 0 };
  if (heightFraction >= 0.35) return { label: "a few steps away", rank: 1 };
  if (heightFraction >= 0.15) return { label: "some distance away", rank: 2 };
  return { label: "far away", rank: 3 };
}

// Small whole numbers sound nicer as words than digits.
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five",
                      "six", "seven", "eight", "nine", "ten"];
function numberToWord(n) {
  return n <= 10 ? NUMBER_WORDS[n] : String(n);
}

// Make a label plural for counts > 1 ("person" -> "people", others add "s").
function pluralize(label, count) {
  if (count === 1) return label;
  if (label === "person") return "people";
  return label + "s";
}

/*
  detectOnce()
  Looks at the camera ONCE, keeps guesses we're >=50% sure of, then checks
  whether anything deserves an automatic spoken alert. Runs on a timer.
*/
async function detectOnce() {
  if (!model || isDetecting || video.readyState < 2) return;

  isDetecting = true;
  try {
    const predictions = await model.detect(video);
    currentDetections = predictions.filter((p) => p.score >= 0.5);
    maybeAutoAlert(); // <-- the new M4 step: talk on our own if needed
  } catch (err) {
    console.error("Detection error:", err);
  } finally {
    isDetecting = false;
  }
}

/*
  maybeAutoAlert()
  The heart of "don't constantly talk." It picks the single most important,
  nearby object and announces it — but only if:
   - it's an important, close-ish object (not far away, not a low-priority item),
   - we haven't spoken very recently (a 3-second calm gap), and
   - we haven't just said this same thing (no repeating "person ahead" forever).
*/
function maybeAutoAlert() {
  const now = Date.now();
  const frameWidth = video.videoWidth;
  const frameHeight = video.videoHeight;
  if (!frameWidth || !frameHeight) return;

  // Look only at important objects that are close enough to matter.
  const candidates = currentDetections
    .map((p) => ({
      cls: p.class,
      priority: priorityOf(p.class),
      direction: directionOf(p, frameWidth),
      closeness: closenessOf(p, frameHeight),
    }))
    .filter((c) => c.priority >= 2 && c.closeness.rank <= 1); // important + near

  if (candidates.length === 0) return;

  // Most urgent first: higher priority, then closer.
  candidates.sort(
    (a, b) => b.priority - a.priority || a.closeness.rank - b.closeness.rank
  );
  const top = candidates[0];

  // Keep a calm gap between any two automatic alerts.
  if (now - lastAlertAt < 3000) return;

  // Don't repeat the exact same alert within 7 seconds.
  const key = top.cls + "|" + top.direction + "|" + top.closeness.rank;
  if (now - (alertHistory.get(key) || 0) < 7000) return;

  // Speak it, e.g. "Person ahead, very close."
  const sentence =
    top.cls.charAt(0).toUpperCase() +
    top.cls.slice(1) +
    " " +
    top.direction +
    ", " +
    top.closeness.label +
    ".";
  speak(sentence);
  setStatus(sentence);
  lastAlertAt = now;
  alertHistory.set(key, now);
}

/*
  reportWhatISee()
  The big button's on-demand job: describe everything currently visible,
  each with its direction and rough distance. Objects that share the same
  name + direction + distance are grouped ("two chairs on your left").
*/
function reportWhatISee() {
  if (currentDetections.length === 0) {
    const msg = "I don't see anything I recognize right now.";
    setStatus(msg);
    speak(msg);
    return;
  }

  const frameWidth = video.videoWidth;
  const frameHeight = video.videoHeight;

  // Group by name + direction + closeness so we can count duplicates.
  const groups = new Map();
  for (const p of currentDetections) {
    const direction = directionOf(p, frameWidth);
    const closeness = closenessOf(p, frameHeight);
    const key = p.class + "|" + direction + "|" + closeness.label;
    if (!groups.has(key)) {
      groups.set(key, {
        cls: p.class,
        direction,
        closeness,
        priority: priorityOf(p.class),
        count: 0,
      });
    }
    groups.get(key).count += 1;
  }

  // Most important / closest first, and don't overwhelm: keep the top 5.
  const items = [...groups.values()]
    .sort(
      (a, b) => b.priority - a.priority || a.closeness.rank - b.closeness.rank
    )
    .slice(0, 5);

  // Build phrases like "two chairs on your left, a few steps away".
  const phrases = items.map((it) => {
    const noun = numberToWord(it.count) + " " + pluralize(it.cls, it.count);
    return noun + " " + it.direction + ", " + it.closeness.label;
  });

  const sentence = "I see " + phrases.join("; ") + ".";
  setStatus(sentence);
  speak(sentence);
}

/*
  onFirstTap()
  One-time startup (camera + voice must start from a real tap on iPhone).
*/
async function onFirstTap() {
  hasStarted = true;

  setStatus("Starting camera…");
  buttonText.textContent = "Starting…";

  const cameraOk = await startCamera();
  if (!cameraOk) {
    setStatus("Camera blocked. Please allow camera access and reload.");
    speak(
      "I could not turn on the camera. Please allow camera access in Safari and reload the page."
    );
    buttonText.textContent = "Camera Blocked";
    return;
  }

  speak(
    "BlindAiGlass is starting. Important: this app is an extra helper only. " +
      "It is not a replacement for your white cane or guide dog. " +
      "Distances I give are rough estimates. I am now loading my vision. One moment."
  );

  setStatus("Loading AI vision…");
  buttonText.textContent = "Loading Vision…";
  try {
    model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
  } catch (err) {
    console.error("Model load error:", err);
    setStatus("Could not load AI vision. Check your internet and reload.");
    speak("I could not load my vision. Please check your internet and reload.");
    buttonText.textContent = "Vision Failed";
    return;
  }

  // Give a short grace period before auto-alerts, so we don't talk over the welcome.
  lastAlertAt = Date.now() + 2000;

  // Start watching the camera in the background (~1.5 looks per second).
  setInterval(detectOnce, 700);

  setStatus("Ready. I will warn you about people and obstacles nearby.");
  button.setAttribute("aria-label", "Tap to hear everything the camera sees");
  buttonText.innerHTML = "Tap to Ask";
  speak(
    "My vision is ready. I will warn you about important things nearby. " +
      "Tap the screen any time to hear everything I see."
  );
}

// A tap starts the app (first time) or gives a full report (after that).
button.addEventListener("click", () => {
  if (!hasStarted) {
    onFirstTap();
  } else {
    reportWhatISee();
  }
});

// On page load, invite the user to tap.
setStatus("Tap anywhere to start.");
