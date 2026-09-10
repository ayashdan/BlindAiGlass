import type { Metadata, Viewport } from "next";
import { Teko } from "next/font/google";
import "./globals.css";

// A bold, condensed display face for headlines and big stat numbers —
// self-hosted by Next.js at build time (next/font), so it's free and adds
// no runtime network request.
const teko = Teko({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BayRan — Construction project management",
  description:
    "Run every job from one place: schedules, selections, materials, subs, and payments, across every active project.",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BayRan",
  },
};

export const viewport: Viewport = {
  themeColor: "#d97706",
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
              "(function(){try{if(localStorage.getItem('bayran-theme')==='light'){document.documentElement.classList.add('light');}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
