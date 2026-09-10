import type { MetadataRoute } from "next";

// Next.js auto-serves this at /manifest.webmanifest and wires up the
// <link rel="manifest"> tag — nothing else needed for that part.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BayRan — Construction project management",
    short_name: "BayRan",
    description: "Run every job from one place, across every active project.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0c0f14",
    theme_color: "#d97706",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
