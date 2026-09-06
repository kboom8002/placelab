import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: "#f0f4fa",
          100: "#dbe5f2",
          200: "#b8cde5",
          300: "#89aed4",
          400: "#5588be",
          500: "#386da6",
          600: "#27548b",
          700: "#1f4270",
          800: "#1a3559",
          900: "#0f1d35",
          950: "#070e1b",
        },
        gold: {
          50: "#fdfbf6",
          100: "#f9f4e8",
          200: "#f2e6cb",
          300: "#e7d2a5",
          400: "#d9ba78",
          500: "#c9a84c",
          600: "#b58e39",
          700: "#926e2c",
          800: "#765727",
          900: "#624724",
        },
        verdict: {
          open: "#059669",
          blocked: "#e11d48",
          selective: "#ea580c",
          nofile: "#64748b",
          undetermined: "#9333ea",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
        serif: ["Georgia", "Cambria", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        "editorial": "0 1px 3px rgba(15, 29, 53, 0.05), 0 10px 25px -5px rgba(15, 29, 53, 0.04)",
        "editorial-hover": "0 4px 6px -1px rgba(15, 29, 53, 0.08), 0 20px 30px -10px rgba(15, 29, 53, 0.08)",
        "card": "0 0 0 1px rgba(15, 29, 53, 0.06), 0 2px 8px -2px rgba(15, 29, 53, 0.04)",
        "card-hover": "0 0 0 1px rgba(201, 168, 76, 0.4), 0 8px 24px -4px rgba(15, 29, 53, 0.08)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
