import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Forge's accent: a molten orange, used for XP, buttons, highlights.
        forge: {
          DEFAULT: "#ff6a1a",
          soft: "#ff8c4b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
