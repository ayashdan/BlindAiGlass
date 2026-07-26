/*
  app.js — the "brain" of BlindAiGlass.

  Working so far:
   - M0/M1: tap to start, rear camera, spoken welcome + safety message.
   - M3: on-device object detection (~80 everyday objects), private + offline.
   - M4: automatic proximity alerts with direction (left/ahead/right).
   - M4.1 (NEW): distance estimates you can hear in STEPS, FEET, or METERS —
       pick your unit with the "Unit" button. (Rough estimates only — a phone
       camera cannot truly measure distance. We always say "about".)
   - M5 (NEW): the "Read" button takes a photo and reads any text out loud
       (menus, signs, labels). It uses Tesseract.js, a free OCR engine that
       runs ENTIRELY ON THE PHONE — no server, no API key, and private. It
       downloads a small model the first time you use Read, then works offline.
*/

// ==========================================================================
//  Page elements
// ==========================================================================
const video = document.getElementById("camera");
const button = document.getElementById("mainButton");
const buttonText = document.getElementById("buttonText");
const statusEl = document.getElementById("status");
const controls = document.getElementById("controls");
const readButton = document.getElementById("readButton");
const unitButton = document.getElementById("unitButton");

// ==========================================================================
//  App state
// ==========================================================================
let hasStarted = false;
let model = null;
let currentDetections = [];
let isDetecting = false;

// Automatic-alert memory (M4)
let lastAlertAt = 0;
const alertHistory = new Map();

// The chosen distance unit: "steps", "feet", or "meters".
// We remember the last choice on this phone using localStorage.
let distanceUnit = localStorage.getItem("distanceUnit") || "steps";

// ==========================================================================
//  Priorities: which objects are worth an automatic alert
// ==========================================================================
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
  Rough real-world HEIGHTS (in meters) of common objects.
  We use these to estimate distance from how tall an object looks on screen.
  Only objects listed here get a numeric distance; others fall back to words
  like "very close" / "a few steps away".
*/
const KNOWN_HEIGHTS = {
  person: 1.7, chair: 0.9, car: 1.5, bus: 3.0, truck: 3.0,
  motorcycle: 1.1, bicycle: 1.1, dog: 0.6, cat: 0.3,
  bottle: 0.25, cup: 0.12, "wine glass": 0.2, laptop: 0.25,
  "cell phone": 0.15, book: 0.24, backpack: 0.45, handbag: 0.3,
  suitcase: 0.6, "potted plant": 0.4, tv: 0.6, couch: 0.9,
  bench: 0.9, "dining table": 0.75, "stop sign": 0.75,
  "traffic light": 0.9, umbrella: 0.9, refrigerator: 1.7,
  microwave: 0.3, oven: 0.7, sink: 0.2, toilet: 0.7, bed: 0.6,
  "teddy bear": 0.3, clock: 0.3, vase: 0.3,
};

// A rough camera constant used in the distance math (see estimateMeters).
// This is only an approximation and will not be exact on every phone.
const FOCAL_FACTOR = 0.82;

// ==========================================================================
//  Speech + status helpers
// ==========================================================================
function speak(text, interrupt = true) {
  if (!("speechSynthesis" in window)) return;
  if (interrupt) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ==========================================================================
//  Camera
// ==========================================================================
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

// ==========================================================================
//  Turning position/size into human words
// ==========================================================================

// LEFT / AHEAD / RIGHT from where the object's middle sits across the frame.
function directionOf(pred, frameWidth) {
  const centerX = pred.bbox[0] + pred.bbox[2] / 2;
  const fraction = centerX / frameWidth;
  if (fraction < 0.34) return "on your left";
  if (fraction > 0.66) return "on your right";
  return "ahead";
}

// A coarse closeness bucket from how tall the object looks. Used to decide
// whether an object is "near enough" to alert about, and as a spoken fallback
// when we don't know the object's real size.
function closenessOf(pred, frameHeight) {
  const heightFraction = pred.bbox[3] / frameHeight;
  if (heightFraction >= 0.6) return { label: "very close", rank: 0 };
  if (heightFraction >= 0.35) return { label: "a few steps away", rank: 1 };
  if (heightFraction >= 0.15) return { label: "some distance away", rank: 2 };
  return { label: "far away", rank: 3 };
}

/*
  estimateMeters(pred, frameHeight)
  A ROUGH distance estimate using the "pinhole camera" idea: an object of known
  real height looks smaller the farther away it is. Returns meters, or null if
  we don't know this object's real size.

  Honest warning: a single phone camera can't truly measure distance, and if
  only part of an object is visible the estimate can be well off. Treat it as a
  soft hint, never a precise figure.
*/
function estimateMeters(pred, frameHeight) {
  const realHeight = KNOWN_HEIGHTS[pred.class];
  if (!realHeight) return null;
  const pixelHeight = pred.bbox[3];
  if (pixelHeight <= 0) return null;
  const focalPx = FOCAL_FACTOR * frameHeight;
  return (realHeight * focalPx) / pixelHeight;
}

// Small whole numbers sound nicer as words.
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five",
                      "six", "seven", "eight", "nine", "ten"];
function numberToWord(n) {
  return n <= 10 ? NUMBER_WORDS[n] : String(n);
}

function pluralize(label, count) {
  if (count === 1) return label;
  if (label === "person") return "people";
  return label + "s";
}

/*
  distanceText(pred, frameHeight)
  Produces the spoken distance in the user's chosen unit — e.g.
  "about three steps away", "about six feet away", "about two meters away" —
  or a word bucket ("very close", "far away") when we can't compute a number.
*/
function distanceText(pred, frameHeight) {
  const meters = estimateMeters(pred, frameHeight);

  // No known size, or extremely close: use the simple word bucket.
  if (meters === null) return closenessOf(pred, frameHeight).label;
  if (meters < 0.7) return "very close";

  if (distanceUnit === "feet") {
    const feet = Math.max(1, Math.round(meters * 3.28084));
    return "about " + numberToWord(feet) + (feet === 1 ? " foot away" : " feet away");
  }

  if (distanceUnit === "meters") {
    // Round to the nearest half-meter under 3m, else to the nearest meter.
    const rounded = meters < 3 ? Math.round(meters * 2) / 2 : Math.round(meters);
    const label = rounded === 1 ? "meter" : "meters";
    return "about " + rounded + " " + label + " away";
  }

  // Default: steps (a walking step is roughly 0.75 meters).
  const steps = Math.max(1, Math.round(meters / 0.75));
  return "about " + numberToWord(steps) + (steps === 1 ? " step away" : " steps away");
}

// ==========================================================================
//  Detection loop + automatic alerts
// ==========================================================================
async function detectOnce() {
  if (!model || isDetecting || video.readyState < 2) return;
  isDetecting = true;
  try {
    const predictions = await model.detect(video);
    currentDetections = predictions.filter((p) => p.score >= 0.5);
    maybeAutoAlert();
  } catch (err) {
    console.error("Detection error:", err);
  } finally {
    isDetecting = false;
  }
}

function maybeAutoAlert() {
  const now = Date.now();
  const frameWidth = video.videoWidth;
  const frameHeight = video.videoHeight;
  if (!frameWidth || !frameHeight) return;

  const candidates = currentDetections
    .map((p) => ({
      pred: p,
      cls: p.class,
      priority: priorityOf(p.class),
      direction: directionOf(p, frameWidth),
      closeness: closenessOf(p, frameHeight),
    }))
    .filter((c) => c.priority >= 2 && c.closeness.rank <= 1); // important + near

  if (candidates.length === 0) return;

  candidates.sort(
    (a, b) => b.priority - a.priority || a.closeness.rank - b.closeness.rank
  );
  const top = candidates[0];

  if (now - lastAlertAt < 3000) return; // calm gap between alerts
  const key = top.cls + "|" + top.direction + "|" + top.closeness.rank;
  if (now - (alertHistory.get(key) || 0) < 7000) return; // no repeats

  const distance = distanceText(top.pred, frameHeight);
  const sentence =
    top.cls.charAt(0).toUpperCase() + top.cls.slice(1) +
    " " + top.direction + ", " + distance + ".";
  speak(sentence);
  setStatus(sentence);
  lastAlertAt = now;
  alertHistory.set(key, now);
}

// ==========================================================================
//  On-demand: "what do you see?"
// ==========================================================================
function reportWhatISee() {
  if (currentDetections.length === 0) {
    const msg = "I don't see anything I recognize right now.";
    setStatus(msg);
    speak(msg);
    return;
  }

  const frameWidth = video.videoWidth;
  const frameHeight = video.videoHeight;

  // Group identical objects that share a direction AND distance phrase.
  const groups = new Map();
  for (const p of currentDetections) {
    const direction = directionOf(p, frameWidth);
    const distance = distanceText(p, frameHeight);
    const key = p.class + "|" + direction + "|" + distance;
    if (!groups.has(key)) {
      groups.set(key, {
        cls: p.class, direction, distance,
        priority: priorityOf(p.class),
        rank: closenessOf(p, frameHeight).rank,
        count: 0,
      });
    }
    groups.get(key).count += 1;
  }

  const items = [...groups.values()]
    .sort((a, b) => b.priority - a.priority || a.rank - b.rank)
    .slice(0, 5);

  const phrases = items.map((it) => {
    const noun = numberToWord(it.count) + " " + pluralize(it.cls, it.count);
    return noun + " " + it.direction + ", " + it.distance;
  });

  const sentence = "I see " + phrases.join("; ") + ".";
  setStatus(sentence);
  speak(sentence);
}

// ==========================================================================
//  Distance unit chooser
// ==========================================================================
function cycleUnit() {
  const order = ["steps", "feet", "meters"];
  const next = order[(order.indexOf(distanceUnit) + 1) % order.length];
  distanceUnit = next;
  localStorage.setItem("distanceUnit", next);

  // Update the button label + its VoiceOver description.
  const nice = next.charAt(0).toUpperCase() + next.slice(1);
  unitButton.innerHTML = "📏<br />" + nice;
  unitButton.setAttribute("aria-label", "Distance unit: " + next + ". Tap to change.");
  speak("Distance in " + next + ".");
  setStatus("Distance unit: " + next + ".");
}

// ==========================================================================
//  Reader (M5): take a photo and read text out loud — ON THE PHONE
//  Uses Tesseract.js (in-browser OCR). No server, no API key, private.
// ==========================================================================

// We create the OCR "worker" once and reuse it. The first call downloads a
// small English model (needs internet that one time); after that it's cached.
let ocrWorkerPromise = null;
function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = Tesseract.createWorker("eng");
  }
  return ocrWorkerPromise;
}

// Grab the current camera frame into a canvas for the OCR engine to read.
// We keep it fairly large because more detail = better text recognition.
function captureFrameCanvas(maxDim = 1600) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.min(1, maxDim / Math.max(vw, vh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function readText() {
  if (!hasStarted) return;
  if (typeof Tesseract === "undefined") {
    speak("The reader could not load. Please check your internet and reload.");
    setStatus("Reader unavailable.");
    return;
  }

  // Take the photo immediately (before any slow model download).
  const canvas = captureFrameCanvas();

  // The very first read may need to download the OCR model — warn kindly.
  const firstTime = ocrWorkerPromise === null;
  if (firstTime) {
    setStatus("Getting the reader ready (first time)…");
    speak("Getting the reader ready for the first time. This may take a moment.");
  } else {
    setStatus("Reading text…");
    speak("Reading. One moment.");
  }

  try {
    const worker = await getOcrWorker();
    const { data } = await worker.recognize(canvas);
    const text = (data.text || "").replace(/\s+/g, " ").trim();

    if (!text) {
      speak("I could not find any text to read. Try holding the phone steady and closer.");
      setStatus("No text found.");
      return;
    }
    setStatus(text.slice(0, 200));
    speak(text);
  } catch (err) {
    console.error("Reader error:", err);
    speak("Sorry, the reader failed. Please try again.");
    setStatus("Reader error.");
  }
}

// ==========================================================================
//  Startup + button wiring
// ==========================================================================
async function onFirstTap() {
  hasStarted = true;
  setStatus("Starting camera…");
  buttonText.textContent = "Starting…";

  const cameraOk = await startCamera();
  if (!cameraOk) {
    setStatus("Camera blocked. Please allow camera access and reload.");
    speak("I could not turn on the camera. Please allow camera access in Safari and reload the page.");
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

  lastAlertAt = Date.now() + 2000; // short grace period before auto-alerts
  setInterval(detectOnce, 700);

  // Reveal the bottom control bar and set the unit button to the saved unit.
  controls.hidden = false;
  const nice = distanceUnit.charAt(0).toUpperCase() + distanceUnit.slice(1);
  unitButton.innerHTML = "📏<br />" + nice;
  unitButton.setAttribute("aria-label", "Distance unit: " + distanceUnit + ". Tap to change.");

  setStatus("Ready. I will warn you about people and obstacles nearby.");
  button.setAttribute("aria-label", "Tap to hear everything the camera sees");
  buttonText.innerHTML = "Tap to Ask";
  speak(
    "My vision is ready. I will warn you about important things nearby. " +
      "Tap the middle of the screen to hear what I see. " +
      "Use the Read button to read text, and the Unit button to change distance units."
  );
}

// The big middle button: start, or report what we see.
button.addEventListener("click", () => {
  if (!hasStarted) onFirstTap();
  else reportWhatISee();
});

// The two control buttons.
readButton.addEventListener("click", readText);
unitButton.addEventListener("click", cycleUnit);

setStatus("Tap anywhere to start.");
