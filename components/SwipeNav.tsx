"use client";

// Clash-Royale-style paging: swipe left/right anywhere on one of the five
// main screens to move to the next/previous tab, and slide the incoming
// page in from the direction it "arrived" from — whether you got there by
// swiping or by tapping the bottom nav. Pages outside the five main tabs
// (World Map, Chests, Shop, etc.) aren't part of the carousel and just
// appear normally.
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TAB_ORDER } from "@/lib/tabs";

const SWIPE_THRESHOLD_PX = 60;
const MAX_OFF_AXIS_RATIO = 0.6;

export default function SwipeNav({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const tabIndex = TAB_ORDER.findIndex((t) => t.href === pathname);

  const prevIndexRef = useRef(tabIndex);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    const prev = prevIndexRef.current;
    setDirection(tabIndex !== -1 && prev !== -1 && tabIndex !== prev ? (tabIndex > prev ? "left" : "right") : null);
    prevIndexRef.current = tabIndex;
  }, [pathname, tabIndex]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || tabIndex === -1) return;

    const end = e.changedTouches[0];
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dy) > Math.abs(dx) * MAX_OFF_AXIS_RATIO) return; // mostly vertical — a scroll, not a swipe

    if (dx < 0 && tabIndex < TAB_ORDER.length - 1) {
      router.push(TAB_ORDER[tabIndex + 1].href);
    } else if (dx > 0 && tabIndex > 0) {
      router.push(TAB_ORDER[tabIndex - 1].href);
    }
  }

  const animClass =
    direction === "left" ? "page-slide-in-left" : direction === "right" ? "page-slide-in-right" : "";

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div key={pathname} className={animClass}>
        {children}
      </div>
    </div>
  );
}
