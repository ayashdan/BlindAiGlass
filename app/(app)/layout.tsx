import BottomNav from "@/components/BottomNav";

// Shared shell for every logged-in screen: the ambient background and the
// persistent bottom tab bar, so navigation and atmosphere are consistent
// everywhere instead of each page being an isolated island.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="ambient-glow" aria-hidden="true" />
      <div className="pb-24">{children}</div>
      <BottomNav />
    </>
  );
}
