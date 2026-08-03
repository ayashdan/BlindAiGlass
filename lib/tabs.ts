// The five main screens — shared by BottomNav (tap) and SwipeNav (swipe) so
// both agree on what "next" and "previous" mean.
import type { ComponentType, SVGProps } from "react";
import { HomeIcon, TrophyIcon, DumbbellIcon, FriendsIcon, ProfileIcon } from "@/components/icons/GameIcons";

export type Tab = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  primary?: boolean;
};

export const TAB_ORDER: Tab[] = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/leaderboard", label: "Ranks", icon: TrophyIcon },
  { href: "/workout", label: "Log", icon: DumbbellIcon, primary: true },
  { href: "/friends", label: "Friends", icon: FriendsIcon },
  { href: "/profile", label: "You", icon: ProfileIcon },
];
