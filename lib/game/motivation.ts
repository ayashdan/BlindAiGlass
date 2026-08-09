// A rotating set of daily motivational lines. Picked deterministically per
// (user, date) — see dailyMotivation() below — so it's stable across
// refreshes within the same day but varies user-to-user and day-to-day.
// Also reused as-is (same seed) by the workout-reminder push notification,
// so whichever quote someone sees on the dashboard is the same one that
// shows up in their first nudge of the day — not two different picks.
// Forty entries so a single user goes roughly a month and a half before a
// repeat is even likely, instead of cycling every ~10 days.
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
  "Nobody regrets a workout once it's done.",
  "One workout won't transform you. Skipping it won't either. Show up anyway.",
  "The hardest part is starting — you already did that by opening the app.",
  "Motivation gets you moving. Habit keeps you moving.",
  "You've survived every hard day so far. That's a perfect record.",
  "A little sore beats a little regret.",
  "Consistency is a quiet kind of strength.",
  "Your body can do it. It's your mind you have to convince.",
  "Show up, even on the days it feels small.",
  "The version of you that keeps going is the one that wins.",
  "Today's effort is tomorrow's strength.",
  "You don't need to feel motivated to start — starting creates the motivation.",
  "Every streak starts with a single day one.",
  "Rest when you need to. Quit? Not today.",
  "Slow progress is still progress.",
  "Build the habit. The results will follow.",
  "You're one workout closer to who you're becoming.",
  "It doesn't have to be perfect. It just has to happen.",
  "The best time to train was earlier. The next best time is now.",
  "Compare yourself to who you were, not who they are.",
  "Discomfort today, strength tomorrow.",
  "Champions are made when nobody's watching.",
  "Push a little harder than you think you can.",
  "Your future self is counting on the choice you make right now.",
  "Effort compounds. Keep depositing.",
  "You don't have to love it. You just have to do it.",
  "Every workout is a vote for the person you want to be.",
  "Strength isn't given. It's built, one rep at a time.",
  "Bad days build good habits.",
  "The gym doesn't care how you feel. Show up anyway.",
];

export function dailyMotivation(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return MESSAGES[h % MESSAGES.length];
}
