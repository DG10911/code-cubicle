import type { Config } from "tailwindcss";

/**
 * Design tokens for the "Intelligence Console" language.
 * Dark, restrained, high-density. One accent per product:
 *  - ORCHESTRA (general): signal cyan
 *  - IMPACTOS (cloudinary): impact green
 * See /docs/DESIGN_SYSTEM.md for the rationale.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Neutral surfaces (near-black, layered depth)
        base: {
          0: "#07080b",
          50: "#0b0d12",
          100: "#0f1219",
          200: "#161a23",
          300: "#1e232e",
          400: "#2a303d",
          500: "#3a4150",
        },
        ink: {
          DEFAULT: "#e6e9ef",
          muted: "#a4adbd",
          faint: "#6b7484",
          ghost: "#454d5c",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
        },
        // Product accents
        signal: {
          DEFAULT: "#38e1c8",
          soft: "#1f8f80",
          dim: "rgba(56,225,200,0.12)",
        },
        impact: {
          DEFAULT: "#5ce27a",
          soft: "#2f8f45",
          dim: "rgba(92,226,122,0.12)",
        },
        // Semantic states
        warn: { DEFAULT: "#f5b942", dim: "rgba(245,185,66,0.12)" },
        danger: { DEFAULT: "#f2637a", dim: "rgba(242,99,122,0.12)" },
        info: { DEFAULT: "#5aa9f5", dim: "rgba(90,169,245,0.12)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
        pop: "0 20px 60px -20px rgba(0,0,0,0.8)",
        glow: "0 0 0 1px rgba(56,225,200,0.25), 0 0 30px -8px rgba(56,225,200,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
        shimmer: "shimmer 1.8s infinite",
        "spin-slow": "spin-slow 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
