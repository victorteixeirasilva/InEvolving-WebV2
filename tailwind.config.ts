import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./layout/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      screens: {
        xs: "320px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      colors: {
        navy: "#0A1929",
        brand: {
          blue: "#1976D2",
          cyan: "#00BCD4",
          purple: "#7B2CBF",
          pink: "#FF006E",
        },
        surface: {
          light: "#F5F7FA",
          dark: "#0F1419",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      transitionTimingFunction: {
        liquid: "cubic-bezier(0.22, 1, 0.36, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        ui: "350ms",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(25, 118, 210, 0.12)",
        "glass-lg": "0 16px 48px rgba(25, 118, 210, 0.18)",
        glow: "0 0 24px rgba(0, 188, 212, 0.35)",
        "glow-pink": "0 0 28px rgba(255, 0, 110, 0.4)",
        "glow-purple": "0 0 28px rgba(123, 44, 191, 0.45)",
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(2%, -3%) scale(1.02)" },
          "66%": { transform: "translate(-2%, 2%) scale(0.98)" },
        },
        rippleExpand: {
          "0%": { width: "8px", height: "8px", opacity: "0.45" },
          "100%": { width: "420px", height: "420px", opacity: "0" },
        },
      },
      animation: {
        "gradient-shift": "gradientShift 14s ease infinite",
        float: "float 18s ease-in-out infinite",
        "ripple-expand": "rippleExpand 0.55s cubic-bezier(0.22,1,0.36,1) forwards",
        shimmer: "shimmer 1.2s ease-in-out infinite",
      },
      backdropBlur: {
        glass: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
