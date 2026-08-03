import type { Metadata, Viewport } from "next";
import { Teko } from "next/font/google";
import "./globals.css";

// A bold, condensed display face for headlines, big stat numbers, nav
// labels, and buttons — the single biggest lever for not reading as
// "default system font with game colors." Self-hosted by Next.js at build
// time (next/font), so it's still free and adds no runtime network request.
const teko = Teko({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forge — Level up your fitness",
  description:
    "Turn every workout into XP. Build streaks. Rank up. Forge your body like a video game.",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  // iOS ignores the web manifest for "Add to Home Screen" — these are what
  // actually control its standalone-app behavior and icon.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Forge",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6a1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={teko.variable}>
      <head>
        {/* Applies a saved "light" preference before first paint, so there's
            no flash of the wrong theme. Dark is the default with no class
            needed (see globals.css), so this only ever adds one class. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('forge-theme')==='light'){document.documentElement.classList.add('light');}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
