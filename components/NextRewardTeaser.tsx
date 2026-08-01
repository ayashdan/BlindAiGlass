// A small "what's coming up" strip — chests and achievements used to just
// silently appear when earned, with no visible countdown building toward
// them. This is the anticipation piece: always know how close the next
// thing is.
export default function NextRewardTeaser({
  levelsToNextChest,
  nextAchievement,
}: {
  levelsToNextChest: number;
  nextAchievement: { icon: string; name: string; remaining: number } | null;
}) {
  if (!nextAchievement && levelsToNextChest <= 0) return null;

  return (
    <div className="fade-in-up mt-3 grid grid-cols-2 gap-3" style={{ animationDelay: "0.02s" }}>
      <div className="game-card rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-center">
        <p className="text-lg">💎</p>
        <p className="mt-0.5 text-xs font-bold text-amber-300">
          {levelsToNextChest} level{levelsToNextChest === 1 ? "" : "s"} to Rare Chest
        </p>
      </div>
      {nextAchievement ? (
        <div className="game-card rounded-xl border border-line bg-surface px-3 py-2.5 text-center">
          <p className="text-lg">{nextAchievement.icon}</p>
          <p className="mt-0.5 text-xs font-bold text-fg">
            {nextAchievement.remaining} to "{nextAchievement.name}"
          </p>
        </div>
      ) : (
        <div className="game-card rounded-xl border border-line bg-surface px-3 py-2.5 text-center">
          <p className="text-lg">🏅</p>
          <p className="mt-0.5 text-xs font-bold text-muted">All caught up</p>
        </div>
      )}
    </div>
  );
}
