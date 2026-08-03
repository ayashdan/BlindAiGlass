import type { MetadataRoute } from "next";

// Next.js auto-serves this at /manifest.webmanifest and wires up the
// <link rel="manifest"> tag — nothing else needed for that part.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Forge — Level up your fitness",
    short_name: "Forge",
    description: "Turn every workout into XP. Build streaks. Rank up.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#ff6a1a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
