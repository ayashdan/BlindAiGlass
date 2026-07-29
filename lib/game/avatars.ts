// The selectable avatar set (emoji-based — free, no image hosting needed).
// `profiles.avatar` predates this picker and defaulted to the plain string
// "flame"; resolveAvatar() falls back to DEFAULT_AVATAR for any stored value
// that isn't one of these, so old rows still render something sensible.
export const AVATARS = ["🔥", "💪", "⚡", "🦾", "🏋️", "🥊", "🐺", "🦁", "🐉", "⭐", "🎯", "🛡️"];
export const DEFAULT_AVATAR = "🔥";

export function resolveAvatar(avatar?: string | null): string {
  return avatar && AVATARS.includes(avatar) ? avatar : DEFAULT_AVATAR;
}
