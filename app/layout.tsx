import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forge — Level up your fitness",
  description:
    "Turn every workout into XP. Build streaks. Rank up. Forge your body like a video game.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
