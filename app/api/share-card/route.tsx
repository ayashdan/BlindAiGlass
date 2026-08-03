import { ImageResponse } from "next/og";

export const runtime = "edge";

// A branded share image (1080×1080, story/chat friendly), generated on the
// fly with Next's built-in ImageResponse — free, no external service. The
// ShareButton fetches this and hands it to the native share sheet, so what
// lands in a group chat is a card, not a wall of pasted text. Only contains
// what the caller passes (public game stats) — nothing sensitive to protect.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("u") || "Forger").slice(0, 20);
  const level = Math.max(1, Math.min(999, Number(searchParams.get("l")) || 1));
  const rank = (searchParams.get("r") || "Beginner").slice(0, 12);
  const streak = Math.max(0, Math.min(9999, Number(searchParams.get("s")) || 0));
  const charClass = (searchParams.get("c") || "").slice(0, 24);
  const prestige = Math.max(0, Math.min(99, Number(searchParams.get("p")) || 0));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,106,26,0.25), transparent 55%), radial-gradient(circle at 75% 85%, rgba(244,63,94,0.18), transparent 55%)",
          color: "#f5f5f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ fontSize: 64 }}>🔥</div>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: 6 }}>FORGE</div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 44,
            fontWeight: 700,
            color: "#f5f5f5",
          }}
        >
          {prestige > 0 ? `⭐×${prestige} ` : ""}
          {username}
        </div>
        {charClass ? (
          <div style={{ display: "flex", marginTop: 8, fontSize: 30, color: "#a3a3a3" }}>
            {charClass}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 20,
            marginTop: 48,
          }}
        >
          <div style={{ fontSize: 42, color: "#a3a3a3" }}>Level</div>
          <div style={{ fontSize: 160, fontWeight: 900, color: "#fbbf24", lineHeight: 1 }}>
            {level}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 24,
            padding: "10px 34px",
            borderRadius: 999,
            backgroundColor: "rgba(251,191,36,0.15)",
            color: "#fbbf24",
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          {rank}
        </div>

        <div style={{ display: "flex", marginTop: 44, fontSize: 38 }}>
          🔥 {streak} day streak
        </div>

        <div style={{ display: "flex", marginTop: 60, fontSize: 26, color: "#a3a3a3" }}>
          Workouts as a game — join my league
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
