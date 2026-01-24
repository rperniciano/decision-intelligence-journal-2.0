/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep backgrounds - matching main app
        "bg-deep": "#0a0a0f",
        "bg-gradient": "#1a1a2e",

        // Primary accent - luminous teal
        accent: {
          DEFAULT: "#00d4aa",
          50: "#e6fff9",
          100: "#b3ffed",
          200: "#80ffe0",
          300: "#4dffd4",
          400: "#1affc7",
          500: "#00d4aa",
          600: "#00a888",
          700: "#007d65",
          800: "#005243",
          900: "#002721",
        },

        // Text colors
        "text-primary": "#f0f0f5",
        "text-secondary": "#9ca3af",

        // Status colors
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",

        // Surface colors for glassmorphism
        surface: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          hover: "rgba(255, 255, 255, 0.08)",
          active: "rgba(255, 255, 255, 0.12)",
        },
      },
      fontFamily: {
        sans: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
