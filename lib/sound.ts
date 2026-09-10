// Small synthesized sound effects via the Web Audio API — no audio files to
// host or ship, just short oscillator notes with a quick attack/decay
// envelope so they read as game "blips" rather than raw tones. Only used
// for the two biggest celebratory beats (chest open, level up) — everyday
// button taps stay silent so it doesn't get grating.
const MUTE_KEY = "forge-sound-muted";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(MUTE_KEY) === "true";
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_KEY, muted ? "true" : "false");
}

function playNote(
  audio: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "sine",
  peakVolume = 0.16
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function playSequence(notes: { freq: number; offset: number; duration: number; type?: OscillatorType }[]) {
  if (isSoundMuted()) return;
  const audio = getContext();
  if (!audio) return;
  const now = audio.currentTime;
  for (const n of notes) playNote(audio, n.freq, now + n.offset, n.duration, n.type ?? "sine");
}

// A quick ascending sparkle — chest lid popping open.
export function playChestOpen(): void {
  playSequence([
    { freq: 523.25, offset: 0, duration: 0.14 }, // C5
    { freq: 659.25, offset: 0.07, duration: 0.16 }, // E5
    { freq: 783.99, offset: 0.14, duration: 0.22 }, // G5
    { freq: 1046.5, offset: 0.22, duration: 0.3 }, // C6
  ]);
}

// A short triumphant fanfare — leveling up.
export function playLevelUp(): void {
  playSequence([
    { freq: 392.0, offset: 0, duration: 0.12, type: "triangle" }, // G4
    { freq: 523.25, offset: 0.1, duration: 0.12, type: "triangle" }, // C5
    { freq: 659.25, offset: 0.2, duration: 0.14, type: "triangle" }, // E5
    { freq: 783.99, offset: 0.32, duration: 0.4, type: "triangle" }, // G5 (held)
  ]);
}

// Achievement unlock — brighter, single sustained chime.
export function playUnlock(): void {
  playSequence([
    { freq: 659.25, offset: 0, duration: 0.16, type: "square" },
    { freq: 987.77, offset: 0.09, duration: 0.35, type: "square" },
  ]);
}
