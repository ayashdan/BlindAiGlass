import BottomNav from "@/components/BottomNav";
import SwipeNav from "@/components/SwipeNav";

// Shared shell for every logged-in screen: the ambient background, swipe
// paging between the five main tabs, and the persistent bottom tab bar —
// navigation and atmosphere stay consistent everywhere instead of each
// page being an isolated island.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="ambient-glow" aria-hidden="true" />
      <SwipeNav>
        <div className="pb-24">{children}</div>
      </SwipeNav>
      <BottomNav />
    </>
  );
}
