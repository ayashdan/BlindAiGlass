/*
  app.js — the "brain" of Milestone 0 + 1.

  What this file does right now:
   1. Waits for the user's first tap (iPhone REQUIRES a tap before it will
      turn on the camera or allow the app to speak).
   2. Turns on the back camera and shows the live picture.
   3. Speaks a welcome + a very important SAFETY message out loud.
   4. After that, tapping the screen speaks a short status message.

  What it does NOT do yet (coming in the next milestones):
   - Detect objects (person / chair / car …)  -> Milestone 3
   - Give smart "Person ahead" alerts          -> Milestone 4
   - Answer questions / describe surroundings   -> Milestone 5 & 6
*/

// Grab the page elements we need to control.
const video = document.getElementById("camera");
const button = document.getElementById("mainButton");
const buttonText = document.getElementById("buttonText");
const statusEl = document.getElementById("status");

// A simple flag so we only run the "start" steps once.
let hasStarted = false;

/*
  speak(text)
  Uses the phone's built-in voice to say something out loud.
  We cancel anything currently being said first, so alerts never pile up
  or talk over each other (this matters a lot later for safety alerts).
*/
function speak(text) {
  // Some browsers/phones don't support speech — fail safely.
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel(); // stop whatever is being said
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;   // normal speaking speed
  utterance.pitch = 1.0;  // normal pitch
  window.speechSynthesis.speak(utterance);
}

/*
  setStatus(text)
  Updates the text at the top of the screen. Because that element is an
  aria-live region, VoiceOver will also read it — a nice backup to speak().
*/
function setStatus(text) {
  statusEl.textContent = text;
}

/*
  startCamera()
  Asks the phone for permission to use the BACK camera and shows the live feed.
  Returns true if it worked, false if the user said no / it failed.
*/
async function startCamera() {
  try {
    // facingMode: "environment" = the rear camera (the one pointing at the world).
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    return true;
  } catch (err) {
    // Most common reason: the user tapped "Don't Allow" on the camera prompt.
    console.error("Camera error:", err);
    return false;
  }
}

/*
  onFirstTap()
  Runs the first time the user taps the screen.
  iPhone only lets us start the camera and speak from inside a real tap,
  which is exactly why the whole app starts with one big "Tap to Start" button.
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

  // Camera is live. Update the screen and the button's job.
  setStatus("Camera on. BlindAiGlass is ready.");
  button.setAttribute("aria-label", "Tap to hear the current status");
  buttonText.innerHTML = "Tap to Ask";

  // The most important message in the whole app: what this tool is and is NOT.
  speak(
    "BlindAiGlass is ready. Important: this app is an extra helper only. " +
      "It is not a replacement for your white cane or guide dog. " +
      "Do not rely on it to cross streets or avoid stairs. " +
      "Object detection will be added in the next step."
  );
}

/*
  onLaterTap()
  Runs on every tap AFTER the app has started.
  For now it just reports status. Later this becomes the "ask a question" button.
*/
function onLaterTap() {
  setStatus("Camera on. Object detection is coming soon.");
  speak("Camera is on. I cannot recognize objects yet. That is the next step.");
}

// Decide which action a tap should do.
button.addEventListener("click", () => {
  if (!hasStarted) {
    onFirstTap();
  } else {
    onLaterTap();
  }
});

// When the page first loads, invite the user to tap.
setStatus("Tap anywhere to start.");
