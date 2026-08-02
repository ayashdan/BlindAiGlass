"use client";

// Clash-Royale-style paging: drag horizontally on one of the five main
// screens and the page follows your finger in real time (no CSS animation
// delay — a direct transform on every touchmove). Release past the
// threshold and the screen finishes sliding off in that direction while
// the next tab slides in from the opposite edge; release short of it and
// it springs back to center. Tapping the bottom nav plays the same
// slide-in on arrival, so both ways of navigating feel like one motion
// language instead of two different mechanisms bolted together.
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TAB_ORDER } from "@/lib/tabs";

const COMMIT_PX = 64;
const AXIS_LOCK_PX = 8;
const EDGE_RESISTANCE = 0.35;
const EXIT_MS = 190;
const SPRING_MS = 220;

export default function SwipeNav({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const tabIndex = TAB_ORDER.findIndex((t) => t.href === pathname);

  // Prefetch neighbors so the swipe-triggered navigation lands instantly —
  // otherwise there'd be a visible stall between the outgoing exit and the
  // incoming entrance, breaking the illusion of one continuous motion.
  useEffect(() => {
    if (tabIndex === -1) return;
    if (tabIndex > 0) router.prefetch(TAB_ORDER[tabIndex - 1].href);
    if (tabIndex < TAB_ORDER.length - 1) router.prefetch(TAB_ORDER[tabIndex + 1].href);
  }, [tabIndex, router]);

  const prevIndexRef = useRef(tabIndex);
  const [enterDirection, setEnterDirection] = useState<"left" | "right" | null>(null);
  useEffect(() => {
    const prev = prevIndexRef.current;
    setEnterDirection(
      tabIndex !== -1 && prev !== -1 && tabIndex !== prev ? (tabIndex > prev ? "left" : "right") : null
    );
    prevIndexRef.current = tabIndex;
  }, [pathname, tabIndex]);

  const trackRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ startX: number; startY: number; axis: "x" | "y" | null; x: number } | null>(null);

  function drag(x: number) {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = `translateX(${x}px)`;
  }

  function spring() {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = `transform ${SPRING_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
    el.style.transform = "";
  }

  function exit(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const dist = direction * (typeof window !== "undefined" ? window.innerWidth : 400);
    el.style.transition = `transform ${EXIT_MS}ms ease-in, opacity ${EXIT_MS}ms ease-in`;
    el.style.transform = `translateX(${dist}px)`;
    el.style.opacity = "0";
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1 || tabIndex === -1) return;
    gesture.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, axis: null, x: 0 };
  }

  function onTouchMove(e: React.TouchEvent) {
    const g = gesture.current;
    if (!g) return;
    const dx = e.touches[0].clientX - g.startX;
    const dy = e.touches[0].clientY - g.startY;

    if (g.axis === null) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (g.axis !== "x") return;

    const hasNext = tabIndex < TAB_ORDER.length - 1;
    const hasPrev = tabIndex > 0;
    const x = (dx < 0 && !hasNext) || (dx > 0 && !hasPrev) ? dx * EDGE_RESISTANCE : dx;
    g.x = x;
    drag(x);
  }

  function onTouchEnd() {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.axis !== "x") return;

    const goNext = g.x < 0 && tabIndex < TAB_ORDER.length - 1;
    const goPrev = g.x > 0 && tabIndex > 0;

    if (Math.abs(g.x) < COMMIT_PX || !(goNext || goPrev)) {
      spring();
      return;
    }

    exit(goNext ? -1 : 1);
    const nextHref = goNext ? TAB_ORDER[tabIndex + 1].href : TAB_ORDER[tabIndex - 1].href;
    window.setTimeout(() => router.push(nextHref), EXIT_MS);
  }

  const animClass =
    enterDirection === "left" ? "page-slide-in-left" : enterDirection === "right" ? "page-slide-in-right" : "";

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      <div ref={trackRef} key={pathname} className={animClass} style={{ touchAction: "pan-y" }}>
        {children}
      </div>
    </div>
  );
}
