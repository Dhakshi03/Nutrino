import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nutrino: {
          primary: "#2E8B57",    // Fresh leaf green
          deep: "#174B35",       // Forest green
          light: "#E7F4E9",      // Soft mint
          bg: "#FAFCF8",         // Warm off-white
          surface: "#FFFFFF",    // White
          sage: "#A7C9A9",       // Secondary sage green
          accent: "#F4D875",     // Soft yellow
          text: "#20352A",       // Dark charcoal green
          muted: "#718078",      // Muted grey-green
          border: "#E5ECE5",     // Pale green-grey
          warning: "#F2B84B",    // Soft amber
          error: "#D97870",      // Muted coral
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "nutrino-sm": "0 2px 8px -2px rgba(23, 75, 53, 0.06)",
        "nutrino-md": "0 8px 24px -6px rgba(23, 75, 53, 0.08)",
        "nutrino-lg": "0 16px 36px -8px rgba(23, 75, 53, 0.12)",
      },
      keyframes: {
        "mascot-wave": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(14deg)" },
          "75%": { transform: "rotate(-8deg)" },
        },
        "mascot-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "mascot-bounce": {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "40%": { transform: "translateY(-8px) scale(1.03)" },
          "60%": { transform: "translateY(-4px) scale(1.01)" },
        },
        "mascot-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.75", transform: "scale(0.96)" },
        },
      },
      animation: {
        "mascot-wave": "mascot-wave 1.8s ease-in-out infinite",
        "mascot-float": "mascot-float 3.2s ease-in-out infinite",
        "mascot-bounce": "mascot-bounce 1.4s ease-in-out infinite",
        "mascot-pulse": "mascot-pulse 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

