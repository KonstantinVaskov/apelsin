import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FF6B00",
          dark: "#E55D00",
          light: "#FFF0E5",
        },
        graphite: {
          DEFAULT: "#15110F",
          soft: "#29211D",
          mist: "#F3EDE7",
        },
        cream: {
          DEFAULT: "#FFF7ED",
          soft: "#FFF3E3",
          deep: "#F7D6AF",
        },
        surface: "#FFFFFF",
        muted: {
          DEFAULT: "#F8F9FA",
          foreground: "#6B7280",
        },
        savings: "#FF9F43",
        success: "#10B981",
      },
      fontFamily: {
        sans: ["var(--font-app)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        kolhoz: {
          "0%, 100%": { transform: "rotate(-0.4deg)" },
          "50%": { transform: "rotate(0.4deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pulseSoft: "pulseSoft 5s ease-in-out infinite",
        kolhoz: "kolhoz 6s ease-in-out infinite",
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(255, 107, 0, 0.12), 0 8px 16px -8px rgba(0,0,0,0.08)",
        glow: "0 0 40px rgba(255, 107, 0, 0.25)",
        premium: "0 28px 80px -32px rgba(24, 17, 12, 0.55), 0 18px 42px -28px rgba(255, 107, 0, 0.55)",
        insetGlow: "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -24px 48px rgba(255,107,0,0.08)",
        brutal: "4px 4px 0 0 rgba(24, 24, 27, 0.12)",
        brutalSm: "3px 3px 0 0 rgba(24, 24, 27, 0.1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
