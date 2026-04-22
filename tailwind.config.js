/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      colors: {
        protocol: {
          bg: "var(--bg)",
          bgElevated: "var(--bg-elevated)",
          surface: "var(--surface)",
          card: "var(--card)",
          ink: "var(--ink)",
          muted: "var(--muted)",
          primary: "var(--primary)",
          primarySoft: "var(--primary-soft)",
          line: "var(--line)",
          positiveBg: "var(--positive-bg)",
          positiveInk: "var(--positive-ink)",
          warningBg: "var(--warning-bg)",
          warningInk: "var(--warning-ink)",
          dangerBg: "var(--danger-bg)",
          dangerInk: "var(--danger-ink)",
          neutralBg: "var(--neutral-bg)",
          neutralInk: "var(--neutral-ink)",
        },
      },
      boxShadow: {
        card: "0 16px 36px -26px rgba(12, 18, 16, 0.5)",
      },
    },
  },
  plugins: [],
};