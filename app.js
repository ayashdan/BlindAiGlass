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
const askButton = document.getElementById("askButton");
const readButton = document.getElementById("readButton");
const unitButton = document.getElementById("unitButton");

// ==========================================================================
//  App state
// ==========================================================================
let hasStarted = false;
let model = null;
let currentDetections = [];
let isDetecting = false;

// Automatic-alert memory (M4 / walking guide)
let lastAlertAt = 0;
const alertHistory = new Map();
// Remembers how big each kind of object looked recently, so we can tell when
// something is getting closer ("approaching"). class -> [{ t, h }] samples.
const sizeHistory = new Map();

// The chosen distance unit: "steps", "feet", or "meters".
// We remember the last choice on this phone using localStorage.
let distanceUnit = localStorage.getItem("distanceUnit") || "steps";

// Voice-question state.
let isListening = false;      // true while recording/answering a spoken question
let asrPipelinePromise = null; // the on-device speech-to-text engine (loaded once)

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
    // Ask for the BACK camera at high resolution. A low-res feed (some phones
    // default to 640x480) is the #1 cause of poor text reading and detection,
    // so we request 1920x1080 — the phone gives the closest it can.
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
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
    // Only keep guesses we're at least 60% sure about, to cut wrong labels.
    currentDetections = predictions.filter((p) => p.score >= 0.6);
    maybeAutoAlert();
  } catch (err) {
    console.error("Detection error:", err);
  } finally {
    isDetecting = false;
  }
}

/*
  isApproaching(cls, h)
  Records how tall this kind of object looks now (h = fraction of the frame),
  then reports true if it has grown noticeably over the last ~1.6 seconds —
  i.e. it is coming toward you. Rough, and walking shakes the camera, so we
  require a clear increase before we say "approaching".
*/
function isApproaching(cls, h) {
  const now = Date.now();
  let samples = sizeHistory.get(cls);
  if (!samples) {
    samples = [];
    sizeHistory.set(cls, samples);
  }
  samples.push({ t: now, h });
  while (samples.length && now - samples[0].t > 1600) samples.shift();

  let smallest = h;
  for (const s of samples) if (s.h < smallest) smallest = s.h;
  return h - smallest > 0.05 && h >= 0.18;
}

/*
  maybeAutoAlert() — the heart of the walking guide.
  It quietly announces the single most important thing in your path:
   - people / vehicles / animals that are near OR approaching,
   - large obstacles right in front of you (trip hazards),
  with direction, rough distance, an "approaching" warning, and — when the
  way ahead is blocked — which side is clearer. It stays silent otherwise.
*/
function maybeAutoAlert() {
  if (isListening) return; // stay quiet while hearing/answering a question
  const now = Date.now();
  const fw = video.videoWidth;
  const fh = video.videoHeight;
  if (!fw || !fh) return;

  // Describe every detection with direction, closeness, and screen height.
  const items = currentDetections.map((p) => ({
    pred: p,
    cls: p.class,
    priority: priorityOf(p.class),
    direction: directionOf(p, fw),
    closeness: closenessOf(p, fh),
    h: p.bbox[3] / fh,
  }));

  // For each kind of object, feed its biggest instance into the approach check.
  const maxHByClass = new Map();
  for (const it of items) {
    if (it.priority >= 1) {
      maxHByClass.set(it.cls, Math.max(maxHByClass.get(it.cls) || 0, it.h));
    }
  }
  const approaching = new Set();
  for (const [cls, h] of maxHByClass) {
    if (isApproaching(cls, h)) approaching.add(cls);
  }

  // What is worth speaking up about while walking:
  //   - people/vehicles/animals that are near, or approaching from any distance
  //   - furniture-type obstacles only when very close and directly ahead
  const candidates = items.filter((it) => {
    if (it.priority >= 2) return it.closeness.rank <= 1 || approaching.has(it.cls);
    if (it.priority === 1) return it.closeness.rank === 0 && it.direction === "ahead";
    return false;
  });
  if (candidates.length === 0) return;

  candidates.sort(
    (a, b) => b.priority - a.priority || a.closeness.rank - b.closeness.rank
  );
  const top = candidates[0];
  const approach = approaching.has(top.cls);
  const urgent = top.closeness.rank === 0 || approach;

  // Speak sooner for urgent things; keep a calm gap otherwise. Never repeat
  // the same alert too quickly.
  const gap = urgent ? 2000 : 3500;
  if (now - lastAlertAt < gap) return;
  const key = top.cls + "|" + top.direction + "|" + (approach ? "approach" : top.closeness.rank);
  const dedup = urgent ? 4000 : 7000;
  if (now - (alertHistory.get(key) || 0) < dedup) return;

  // Build the short spoken message.
  const name = top.cls.charAt(0).toUpperCase() + top.cls.slice(1);
  let msg;
  if (approach) {
    msg = name + " approaching" + (top.direction === "ahead" ? "" : " " + top.direction) + ".";
  } else {
    msg = name + " " + top.direction + ", " + distanceText(top.pred, fh) + ".";
  }

  // If something important is close and directly ahead, point to the clearer
  // side. This is a simple hint from what the camera sees — NOT real navigation.
  if (top.direction === "ahead" && top.closeness.rank <= 1) {
    const nearLeft = items.some(
      (it) => it.priority >= 1 && it.closeness.rank <= 1 && it.direction === "on your left"
    );
    const nearRight = items.some(
      (it) => it.priority >= 1 && it.closeness.rank <= 1 && it.direction === "on your right"
    );
    if (!nearLeft && nearRight) msg += " Clearer on your left.";
    else if (!nearRight && nearLeft) msg += " Clearer on your right.";
    else if (!nearLeft && !nearRight) msg += " Sides look clearer.";
  }

  speak(msg);
  setStatus(msg);
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
    ocrWorkerPromise = (async () => {
      const worker = await Tesseract.createWorker("eng");
      // A DPI hint helps Tesseract judge text size; "auto" page layout copes
      // with both blocks of text (menus) and scattered text (labels).
      await worker.setParameters({
        user_defined_dpi: "300",
        tessedit_pageseg_mode: "3",
      });
      return worker;
    })();
  }
  return ocrWorkerPromise;
}

/*
  captureFrameForOcr()
  Grab the current camera frame and clean it up for reading:
   - keep lots of detail (up to 2000px), because small text needs pixels,
   - convert to grayscale,
   - stretch the contrast so faint text becomes crisp black-on-white.
  These simple steps dramatically improve on-device OCR accuracy.
*/
function captureFrameForOcr(maxDim = 2000) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.min(1, maxDim / Math.max(vw, vh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  // Pass 1: grayscale, and find the darkest and lightest pixels.
  let min = 255;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
    d[i] = d[i + 1] = d[i + 2] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }

  // Pass 2: stretch that range across full black-to-white for max contrast.
  const range = Math.max(1, max - min);
  for (let i = 0; i < d.length; i += 4) {
    const v = (((d[i] - min) * 255) / range) | 0;
    d[i] = d[i + 1] = d[i + 2] = v;
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

async function readText() {
  if (!hasStarted) return;
  if (typeof Tesseract === "undefined") {
    speak("The reader could not load. Please check your internet and reload.");
    setStatus("Reader unavailable.");
    return;
  }

  // Take the photo immediately (before any slow model download), cleaning it
  // up (grayscale + contrast) so the OCR engine reads it far more accurately.
  const canvas = captureFrameForOcr();

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
//  Voice questions (tap 🎤, speak, get an answer) — ON THE PHONE
//  Uses Whisper via transformers.js for speech-to-text. No server, no key.
// ==========================================================================

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Say something and show it — used for spoken answers.
function say(msg) {
  setStatus(msg);
  speak(msg);
}

// Load the on-device speech-to-text engine once (downloads a model the first
// time — needs internet that once, then works offline).
async function getASR() {
  if (!asrPipelinePromise) {
    const mod = await import(
      "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2"
    );
    mod.env.allowLocalModels = false; // fetch the model from the internet
    asrPipelinePromise = mod.pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny.en"
    );
  }
  return asrPipelinePromise;
}

// Record a few seconds of microphone audio and return it as a Blob.
async function recordAudio(ms) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };
  const stopped = new Promise((resolve) => {
    recorder.onstop = resolve;
  });
  recorder.start();
  await delay(ms);
  recorder.stop();
  await stopped;
  stream.getTracks().forEach((t) => t.stop()); // release the mic
  return new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
}

// Convert recorded audio into the format Whisper wants: mono, 16,000 samples
// per second, as raw numbers.
async function blobToPcm16k(blob) {
  const arrayBuf = await blob.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const decoded = await ctx.decodeAudioData(arrayBuf);
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const length = Math.max(1, Math.ceil(decoded.duration * 16000));
  const offline = new OAC(1, length, 16000);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();
  if (ctx.close) ctx.close();
  return rendered.getChannelData(0);
}

async function transcribe(blob) {
  const asr = await getASR();
  const pcm = await blobToPcm16k(blob);
  const out = await asr(pcm);
  return (out && out.text ? out.text : "").trim();
}

/*
  Words people might use for each object we can recognize. If a spoken question
  contains one of these, we know which object they're asking about.
*/
const CLASS_SYNONYMS = {
  person: ["person", "people", "someone", "anyone", "human", "man", "woman"],
  chair: ["chair", "chairs", "seat", "seats"],
  car: ["car", "cars", "vehicle", "vehicles", "traffic"],
  bus: ["bus", "buses"],
  truck: ["truck", "trucks"],
  bicycle: ["bicycle", "bicycles", "bike", "bikes"],
  motorcycle: ["motorcycle", "motorbike", "scooter"],
  dog: ["dog", "dogs", "puppy"],
  cat: ["cat", "cats", "kitten"],
  bench: ["bench", "benches"],
  couch: ["couch", "sofa"],
  bottle: ["bottle", "bottles", "water bottle"],
  cup: ["cup", "cups", "mug"],
  "dining table": ["table", "tables", "desk"],
  tv: ["tv", "television", "screen", "monitor"],
  laptop: ["laptop", "computer"],
  "cell phone": ["phone", "cellphone", "mobile"],
  book: ["book", "books"],
  backpack: ["backpack", "bag", "rucksack"],
  refrigerator: ["fridge", "refrigerator"],
  "potted plant": ["plant", "plants"],
  "stop sign": ["stop sign"],
  "traffic light": ["traffic light", "stoplight"],
};

// Things people commonly ask about that we CANNOT reliably detect. We answer
// honestly rather than guessing (important for safety).
const UNDETECTABLE = [
  "stairs", "staircase", "stair", "step", "steps", "curb",
  "door", "doorway", "entrance", "exit", "escalator", "elevator",
];

// Find which object a spoken question is about (or flag it as undetectable).
function matchClass(text) {
  for (const [cls, words] of Object.entries(CLASS_SYNONYMS)) {
    for (const w of words) {
      if (text.includes(w)) return cls;
    }
  }
  for (const s of UNDETECTABLE) {
    if (text.includes(s)) return "__undetectable__:" + s;
  }
  return null;
}

// Join a few directions naturally: "on your left" / "on your left and ahead".
function joinDirections(dirs) {
  if (dirs.length === 1) return dirs[0];
  if (dirs.length === 2) return dirs[0] + " and " + dirs[1];
  return dirs.slice(0, -1).join(", ") + ", and " + dirs[dirs.length - 1];
}

/*
  answerQuestion(text)
  Understand the transcribed question and answer it from what the camera sees.
  Handles: read text; how many X; where is X; is there an X; and general
  "what's in front of me" (anything else).
*/
function answerQuestion(text) {
  const t = text.toLowerCase();
  const fw = video.videoWidth;
  const fh = video.videoHeight;

  // "Read this / what does the sign say" -> the Reader.
  if (/\b(read|reads|reading|says|written|writing|label|menu|sign|text)\b/.test(t)) {
    readText();
    return;
  }

  const target = matchClass(t);

  // Honest answer for things we can't see.
  if (target && target.startsWith("__undetectable__:")) {
    const thing = target.split(":")[1];
    say("I'm sorry, I can't detect " + thing + ". Please use your cane or guide dog for that.");
    return;
  }

  if (target) {
    const found = currentDetections.filter((d) => d.class === target);
    const count = found.length;

    if (/how many/.test(t)) {
      if (count === 0) return say("I don't see any " + pluralize(target, 2) + " right now.");
      return say("I see " + numberToWord(count) + " " + pluralize(target, count) + ".");
    }
    if (/(where|which way|which side)/.test(t)) {
      if (count === 0) return say("I don't see a " + target + " right now.");
      const dirs = [...new Set(found.map((d) => directionOf(d, fw)))];
      return say("A " + target + " " + joinDirections(dirs) + ".");
    }
    // "is there / do you see / any ..." and general mentions of the object.
    if (count === 0) return say("No, I don't see a " + target + " right now.");
    const nearest = found
      .slice()
      .sort((a, b) => closenessOf(a, fh).rank - closenessOf(b, fh).rank)[0];
    return say(
      "Yes, a " + target + " " + directionOf(nearest, fw) + ", " + distanceText(nearest, fh) + "."
    );
  }

  // No specific object mentioned -> describe everything ahead.
  reportWhatISee();
}

/*
  askByVoice()
  The 🎤 button: listen for a few seconds, transcribe on the phone, then answer.
*/
async function askByVoice() {
  if (!hasStarted || isListening) return;
  if (typeof MediaRecorder === "undefined") {
    say("Sorry, this phone does not support voice questions.");
    return;
  }

  isListening = true;
  try {
    setStatus("Listening… ask your question.");
    speak("Listening. Ask your question.");
    await delay(1100); // let the prompt finish so we don't record our own voice

    const audio = await recordAudio(4500); // ~4.5 seconds to speak

    const firstTime = asrPipelinePromise === null;
    setStatus(firstTime ? "Getting the voice model ready (first time)…" : "Thinking…");
    speak(firstTime ? "Getting ready for the first time. One moment." : "One moment.");

    const text = await transcribe(audio);
    if (!text) {
      say("Sorry, I didn't catch that. Tap the microphone and try again.");
      return;
    }
    setStatus('You asked: "' + text + '"');
    answerQuestion(text);
  } catch (err) {
    console.error("Voice question error:", err);
    if (err && err.name === "NotAllowedError") {
      say("I need microphone permission to hear questions. Please allow it in Safari.");
    } else {
      say("Sorry, voice questions failed. Please try again.");
    }
  } finally {
    isListening = false;
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
    // Use the full model ("mobilenet_v2") instead of the "lite" one — it is
    // more accurate at recognizing objects (a little slower, worth it).
    model = await cocoSsd.load({ base: "mobilenet_v2" });
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

  setStatus("Walking guide ready. Watching for people, vehicles, and obstacles.");
  button.setAttribute("aria-label", "Tap to hear what is directly ahead");
  buttonText.innerHTML = "Tap to Ask";
  speak(
    "Your walking guide is ready. As you walk, I will quietly warn you about " +
      "people, vehicles, and obstacles nearby, and tell you when something is " +
      "approaching or which side is clearer. Very important: I cannot see steps, " +
      "stairs, or drop-offs, so keep using your cane or guide dog for those. " +
      "Tap the middle of the screen to hear what is directly ahead, or tap the " +
      "microphone button and ask a question, like: what is in front of me?"
  );
}

// The big middle button: start, or report what we see.
button.addEventListener("click", () => {
  if (!hasStarted) onFirstTap();
  else reportWhatISee();
});

// The three control buttons.
askButton.addEventListener("click", askByVoice);
readButton.addEventListener("click", readText);
unitButton.addEventListener("click", cycleUnit);

setStatus("Tap anywhere to start.");
