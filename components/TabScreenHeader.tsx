// A consistent title banner for the four peer tabs alongside Home (Ranks,
// Log, Friends, Profile uses its own identity card instead). These used to
// each carry a "← Back to Dashboard" link, a holdover from when they were
// pages you drilled into — now that they're swipeable siblings reachable
// from the bottom nav, a back link back to one specific sibling doesn't
// make sense. A title banner in their place matches how Clash Royale's own
// main screens (Shop, Cards, Clan…) identify themselves without a back
// button.
export default function TabScreenHeader({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="fade-in-up forge-panel mb-6 flex items-center gap-3 px-5 py-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <h1 className="text-xl font-black uppercase tracking-wide">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
