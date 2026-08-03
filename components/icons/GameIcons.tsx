// A small custom stroke-icon set for the two most-visible pieces of chrome
// in the app — the bottom nav and Home's "Where to next" doors — so those
// spots stop reading as "emoji pasted into a UI" and start reading as a
// deliberate icon language, the same way ChestGraphic/ClassEmblem/
// WorldMapPath already replaced emoji-only treatment elsewhere. Same
// stroke weight and line style across the set on purpose, so they read as
// one family rather than a grab-bag.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 12 12 5l8 7" />
      <path d="M6 11v8a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8" />
    </Base>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4.5A2.5 2.5 0 0 0 7 9.5" />
      <path d="M17 5h2.5A2.5 2.5 0 0 1 17 9.5" />
      <path d="M12 11v3" />
      <path d="M9 20h6" />
      <path d="M10.5 14h3l.8 3.5a1 1 0 0 1-1 1.5h-2.6a1 1 0 0 1-1-1.5l.8-3.5Z" />
    </Base>
  );
}

export function DumbbellIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2.5" y="9.5" width="3" height="5" rx="1" />
      <rect x="18.5" y="9.5" width="3" height="5" rx="1" />
      <path d="M5.5 12h13" />
      <rect x="6.5" y="7.5" width="2.5" height="9" rx="1" />
      <rect x="15" y="7.5" width="2.5" height="9" rx="1" />
    </Base>
  );
}

export function FriendsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.5" />
      <path d="M3.5 20c0-3.6 2.5-6.5 5.5-6.5s5.5 2.9 5.5 6.5" />
      <path d="M15 14c2.3.4 4 2.9 4 6" />
    </Base>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5" />
    </Base>
  );
}

export function ScrollIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M9 9h6M9 12.5h6M9 16h3.5" />
    </Base>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </Base>
  );
}

export function MedalIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 3 6 9l3 1" />
      <path d="M15 3l3 6-3 1" />
      <circle cx="12" cy="14" r="6" />
      <circle cx="12" cy="14" r="2.5" />
    </Base>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22.5v-17Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 1 2.5 2.5v-17Z" />
    </Base>
  );
}

export function ChestIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="10" width="16" height="9" rx="1.5" />
      <path d="M4 10a8 4 0 0 1 16 0" />
      <circle cx="12" cy="14" r="1.6" />
    </Base>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h7.6a2 2 0 0 0 2-1.6L21 8H6" />
      <circle cx="9.5" cy="21" r="1.4" />
      <circle cx="17" cy="21" r="1.4" />
    </Base>
  );
}
