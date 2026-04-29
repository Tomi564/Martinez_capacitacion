import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#C8102E",
          foreground: "#FFFFFF",
          dark: "#A30D25",
        },
        "brand-yellow": "#F5C400",
        background: "#FAFAFA",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        text: {
          primary: "#111827",
          secondary: "#6B7280",
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "12px",
      },
      fontFamily: {
        sans: ["var(--font-exo)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(17, 24, 39, 0.08)",
      },
    },
  },
};

export default config;
