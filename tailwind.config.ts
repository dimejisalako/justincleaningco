import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Brand colors taken from the logo: deep navy wordmark + teal accent.
      colors: {
        navy: {
          DEFAULT: "#0f2445",
          50: "#eef3fa",
          100: "#d5e0f0",
          600: "#1d3a6b",
          700: "#152d55",
          900: "#0a1a33",
        },
        teal: {
          DEFAULT: "#14a89c",
          50: "#e8f8f6",
          100: "#c6eeea",
          600: "#0f8a7f",
          700: "#0b6d65",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
