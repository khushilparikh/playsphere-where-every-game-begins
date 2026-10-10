import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light "match day" canvas — soft warm pink-white base, pure white cards.
        court: {
          DEFAULT: "#FDF1F2",
          surface: "#FFFFFF",
          surface2: "#FFF7F8",
          line: "#FBDEE1",
        },
        // Primary action / brand color — scoreboard coral-red.
        volt: {
          DEFAULT: "#FF4757",
          dim: "#E5303F",
          soft: "#FFE7E9",
        },
        // Secondary / live-action color — trophy gold.
        whistle: {
          DEFAULT: "#FFB020",
          dim: "#E69A0C",
          soft: "#FFF4DF",
        },
        // Tertiary accent — deep arena navy, used for dark scoreboard-style
        // cards (match scores, featured stats) as well as sparingly for
        // richness elsewhere.
        spark: {
          DEFAULT: "#1B1F3B",
          soft: "#E9EAF3",
        },
        // Text — near-black ink for bold, confident headers.
        ink: {
          DEFAULT: "#14141C",
          muted: "#5C5C68",
          faint: "#8A8A96",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 1px 1px, rgba(20,20,28,0.05) 1px, transparent 0)",
        "conic-volt":
          "conic-gradient(from 0deg, #FF4757, #FF8A93, #FFB020, #FF4757)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,20,28,0.05), 0 8px 24px -8px rgba(20,20,28,0.12)",
        "card-hover": "0 2px 6px rgba(20,20,28,0.08), 0 24px 48px -12px rgba(20,20,28,0.22)",
        glow: "0 0 0 1px rgba(255,71,87,0.14), 0 12px 40px -8px rgba(255,71,87,0.38)",
        nav: "0 1px 0 rgba(20,20,28,0.05), 0 4px 16px -8px rgba(20,20,28,0.10)",
        "glow-whistle": "0 0 0 1px rgba(255,176,32,0.18), 0 12px 40px -8px rgba(255,176,32,0.38)",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(0, -18px) scale(1.04)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "50%": { transform: "translate(14px, 10px) rotate(4deg)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        gradientMove: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        risePop: {
          "0%": { transform: "scale(0.96) translateY(8px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        marqueeFade: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        scanLaser: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(160px)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        ticker: "ticker 32s linear infinite",
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        floatSlow: "floatSlow 11s ease-in-out infinite",
        spinSlow: "spinSlow 7s linear infinite",
        gradientMove: "gradientMove 6s ease infinite",
        shimmer: "shimmer 2.2s linear infinite",
        risePop: "risePop 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "scan-laser": "scanLaser 2s linear infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
