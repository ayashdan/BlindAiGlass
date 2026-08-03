import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Bold/condensed — headlines, big numbers, nav labels, buttons.
        // Falls back to the default sans if the variable isn't set yet
        // (e.g. a component rendered outside the root layout in tests).
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Forge's accent: a molten orange, used for XP, buttons, highlights.
        forge: {
          DEFAULT: "#ff6a1a",
          soft: "#ff8c4b",
        },
        // Semantic surface tokens, driven by CSS variables so light/dark mode
        // is a class toggle rather than sprinkling dark: everywhere.
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface-2) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};

export default config;
