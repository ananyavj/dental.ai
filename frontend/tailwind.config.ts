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
        background: { light: "#F9FAFB", dark: "#0C0C0C" },
        surface: { light: "#FFFFFF", dark: "#161616" },
        border: { light: "#E5E7EB", dark: "#2A2A2A" },
        text: {
          primary: { light: "#111827", dark: "#F9FAFB" },
          muted: { light: "#6B7280", dark: "#9CA3AF" },
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        // Using CSS variables to handle the dynamic Doctor (Orange) vs Student (Blue) mode
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          50: "var(--primary-50)",
          100: "var(--primary-100)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
