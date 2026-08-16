import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#ECE7DB",
        "paper-raised": "#F6F2E8",
        ink: "#211F1B",
        "ink-soft": "#5B584E",
        "ink-deep": "#17150F",
        "ink-panel": "#211E18",
        seal: "#AE3B34",
        "seal-dark": "#8C2E29",
        jade: "#4B7466",
        line: "#D8D1BE",
        "line-dark": "#3A362C",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        stamp: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
