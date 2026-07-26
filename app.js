/*
  app.js — the "brain" of BlindAiGlass.

  Milestones working so far:
   - M0/M1: tap to start, turn on the rear camera, speak a welcome + safety message.
   - M3 (NEW): on-device object detection. The app now recognizes ~80 everyday
     objects (person, chair, car, bottle, dog, …) using a small AI model that
     runs entirely ON THE PHONE. Tap the screen and it tells you what it sees.

  Still to come:
   - M4: automatic "Person ahead" style alerts (only when things change).
   - M5/M6: answering spoken questions and describing surroundings with cloud AI.
*/

// ----- Page elements we control -----
const video = document.getElementById("camera");
const button = document.getElementById("mainButton");
const buttonText = document.getElementById("buttonText");
const statusEl = document.getElementById("status");

// ----- App state (little bits of memory) -----
let hasStarted = false;      // have we done the one-time startup yet?
let model = null;            // the loaded AI vision model (null until it finishes loading)
let currentDetections = [];  // the most recent list of objects the camera sees
let isDetecting = false;     // guard so we don't run two detections at the same time

/*
  speak(text)
  Says something out loud using the phone's built-in voice.
  We cancel anything already being said so alerts never overlap.
*/
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
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
  Asks for the BACK camera and shows the live picture.
  Returns true on success, false if blocked/failed.
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
  detectOnce()
  Looks at the current camera picture ONE time and updates currentDetections.
  We keep only guesses the model is at least 50% sure about, to cut down on
  mistakes. This runs on a timer (a few times per second) in the background.
*/
async function detectOnce() {
  // Skip if the model isn't ready, a detection is already running,
  // or the video has no picture yet.
  if (!model || isDetecting || video.readyState < 2) return;

  isDetecting = true;
  try {
    const predictions = await model.detect(video);
    currentDetections = predictions.filter((p) => p.score >= 0.5);
  } catch (err) {
    console.error("Detection error:", err);
  } finally {
    isDetecting = false;
  }
}

/*
  ----- Turning a list of objects into natural speech -----

  The model gives us raw labels like ["person", "chair", "chair"].
  We want to SAY "one person and two chairs" — grouped, counted, and readable.
*/

// Small whole numbers sound nicer as words than digits.
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five",
                      "six", "seven", "eight", "nine", "ten"];

function numberToWord(n) {
  return n <= 10 ? NUMBER_WORDS[n] : String(n);
}

// Make a label plural when there is more than one. English is irregular,
// so we special-case "person" -> "people" and add "s" to the rest.
function pluralize(label, count) {
  if (count === 1) return label;
  if (label === "person") return "people";
  return label + "s";
}

/*
  describeDetections(detections)
  Turns the raw detections into one friendly sentence, or a "nothing" message.
*/
function describeDetections(detections) {
  if (detections.length === 0) {
    return "I don't see anything I recognize right now.";
  }

  // Count how many of each object there are, e.g. { person: 1, chair: 2 }.
  const counts = {};
  for (const d of detections) {
    counts[d.class] = (counts[d.class] || 0) + 1;
  }

  // Build phrases like "one person", "two chairs".
  const phrases = Object.keys(counts).map((label) => {
    const count = counts[label];
    return numberToWord(count) + " " + pluralize(label, count);
  });

  // Join naturally: "a", "a and b", "a, b, and c".
  let list;
  if (phrases.length === 1) {
    list = phrases[0];
  } else if (phrases.length === 2) {
    list = phrases[0] + " and " + phrases[1];
  } else {
    list =
      phrases.slice(0, -1).join(", ") + ", and " + phrases[phrases.length - 1];
  }

  return "I see " + list + ".";
}

/*
  reportWhatISee()
  The current job of the big button: say out loud what the camera sees now.
*/
function reportWhatISee() {
  const sentence = describeDetections(currentDetections);
  setStatus(sentence);
  speak(sentence);
}

/*
  onFirstTap()
  One-time startup. Must run inside a real tap because iPhone only allows
  the camera and the voice to start from a user action.
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

  // Camera is live. Speak the welcome + the all-important safety message.
  speak(
    "BlindAiGlass is starting. Important: this app is an extra helper only. " +
      "It is not a replacement for your white cane or guide dog. " +
      "Do not rely on it to cross streets or avoid stairs. " +
      "I am now loading my vision. One moment."
  );

  // Load the AI vision model. This downloads once (needs internet the first time).
  setStatus("Loading AI vision…");
  buttonText.textContent = "Loading Vision…";
  try {
    // "lite_mobilenet_v2" is the fastest version — best for phones.
    model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
  } catch (err) {
    console.error("Model load error:", err);
    setStatus("Could not load AI vision. Check your internet and reload.");
    speak("I could not load my vision. Please check your internet and reload.");
    buttonText.textContent = "Vision Failed";
    return;
  }

  // Model is ready. Start watching the camera in the background.
  // Every 700 milliseconds we take one look. This is often enough for walking
  // speed while being gentle on the battery.
  setInterval(detectOnce, 700);

  // Update the button's job and tell the user we're ready.
  setStatus("Ready. Tap to hear what I see.");
  button.setAttribute("aria-label", "Tap to hear what the camera sees");
  buttonText.innerHTML = "Tap to Ask";
  speak("My vision is ready. Tap the screen and I will tell you what I see.");
}

// A tap either starts the app (first time) or reports what we see (after that).
button.addEventListener("click", () => {
  if (!hasStarted) {
    onFirstTap();
  } else {
    reportWhatISee();
  }
});

// On page load, invite the user to tap.
setStatus("Tap anywhere to start.");
