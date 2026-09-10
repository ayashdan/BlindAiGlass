// Pure email content — subject + HTML body only, no Resend dependency and
// no side effects, so these are easy to read/adjust without touching the
// sending code in lib/email-server.ts.

const WRAP = (title: string, bodyHtml: string) => `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr><td align="center">
        <table width="100%" style="max-width:480px;background:#171717;border-radius:16px;overflow:hidden;border:1px solid #292524;">
          <tr><td style="padding:32px 28px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#ff6a1a;">FORGE</p>
            <h1 style="margin:8px 0 16px;font-size:22px;font-weight:900;color:#fafafa;">${title}</h1>
            <div style="font-size:15px;line-height:1.6;color:#d4d4d4;">${bodyHtml}</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const BUTTON = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#ff6a1a;color:#0a0a0a;font-weight:800;text-decoration:none;border-radius:8px;">${label}</a>`;

export function welcomeEmail(username: string, appUrl: string) {
  return {
    subject: "Welcome to Forge 🔥",
    html: WRAP(
      `Welcome to Forge, ${username}!`,
      `<p>Your account's live. Forge turns your workouts into a real game — XP, levels, streaks, chests, and a rank that climbs from Beginner to Elite.</p>
       <p>Log your first workout to get the ball rolling — every one earns XP and a Common Chest.</p>
       ${BUTTON(`${appUrl}/workout`, "Log your first workout")}`
    ),
  };
}

export function inactivityEmail(username: string, appUrl: string) {
  return {
    subject: "We miss you at Forge 🔥",
    html: WRAP(
      `It's been a week, ${username}`,
      `<p>You haven't logged a workout in 7 days — your streak and stats are exactly where you left them, waiting.</p>
       <p>One workout gets you right back in it.</p>
       ${BUTTON(`${appUrl}/workout`, "Jump back in")}`
    ),
  };
}

type EducationStep = { subject: string; title: string; body: string; url: string; label: string };

const EDUCATION_STEPS: EducationStep[] = [
  {
    subject: "Chests are dropping 📦",
    title: "Ever open a chest?",
    body: "Every workout you log drops a Common Chest, and every 5 levels you climb drops a Rare one. Every chest's reward range is shown up front — no gambling, no blind luck, just XP (and sometimes a streak freeze) waiting to be claimed.",
    url: "/chests",
    label: "Open your chests",
  },
  {
    subject: "There's a whole map of your progress 🗺️",
    title: "Have you seen the World Map?",
    body: "Every level you earn is a real stop on a winding path — rank-ups are marked, chest waypoints are marked, and you can see exactly how far you've come and what's next.",
    url: "/world",
    label: "View the World Map",
  },
  {
    subject: "Bring your friends into it 🤝",
    title: "Forge is better with people you know",
    body: "Add friends by username and you'll get a small leaderboard just between you — way more motivating than a global list full of strangers.",
    url: "/friends",
    label: "Add a friend",
  },
];

export const EDUCATION_STEP_COUNT = EDUCATION_STEPS.length;

export function educationEmail(step: number, username: string, appUrl: string) {
  const s = EDUCATION_STEPS[step];
  if (!s) return null;
  return {
    subject: s.subject,
    html: WRAP(s.title, `<p>Hey ${username} —</p><p>${s.body}</p>${BUTTON(`${appUrl}${s.url}`, s.label)}`),
  };
}
