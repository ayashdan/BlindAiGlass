// A small rotating set of daily motivational lines. Picked deterministically
// per (user, date) so it's stable across refreshes within the same day but
// varies user-to-user and day-to-day.
const MESSAGES = [
  "Every rep counts. Show up for yourself today.",
  "You don't have to be extreme, just consistent.",
  "Future you is thanking you for this workout.",
  "Small steps daily beat big leaps rarely.",
  "The only bad workout is the one that didn't happen.",
  "Discipline is choosing between what you want now and what you want most.",
  "You're not tired, you're just uninspired. Let's fix that.",
  "Progress, not perfection.",
  "Strong today, stronger tomorrow.",
  "Your only competition is who you were yesterday.",
];

export function dailyMotivation(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return MESSAGES[h % MESSAGES.length];
}
