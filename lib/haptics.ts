// Thin wrapper over the Vibration API — no-ops everywhere it's unsupported
// (iOS Safari has never implemented it) so call sites don't need their own
// feature detection. Client-only; safe to import from server files as long
// as it's only ever called inside event handlers/effects.
export function vibrate(pattern: number | number[]): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore — never let a haptic failure interrupt anything
  }
}
