/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      colors: {
        protocol: {
          bgPrimary: "var(--bg-primary)",
          bgSecondary: "var(--bg-secondary)",
          bgTertiary: "var(--bg-tertiary)",
          accent: "var(--accent)",
          accentSoft: "var(--accent-soft)",
          accentEmerald: "var(--accent-emerald)",
          textPrimary: "var(--text-primary)",
          textSecondary: "var(--text-secondary)",
          success: "var(--success)",
          warning: "var(--warning)",
          onAccent: "var(--on-accent)",
          primaryStart: "var(--primary-start)",
          primaryEnd: "var(--primary-end)",
          border: "var(--border)",
          danger: "var(--danger)",
          neutralSoft: "var(--neutral-soft)",

          bg: "var(--bg-primary)",
          bgElevated: "var(--bg-secondary)",
          surface: "var(--bg-primary)",
          card: "var(--bg-secondary)",
          ink: "var(--text-primary)",
          muted: "var(--text-secondary)",
          primary: "var(--accent)",
          primarySoft: "var(--accent-soft)",
          line: "var(--border)",
          positiveBg: "var(--success-soft)",
          positiveInk: "var(--success)",
          warningBg: "var(--warning-soft)",
          warningInk: "var(--warning)",
          dangerBg: "var(--danger-soft)",
          dangerInk: "var(--danger)",
          neutralBg: "var(--neutral-soft)",
          neutralInk: "var(--text-secondary)",
        },
      },
      boxShadow: {
        card: "0 14px 30px -18px rgba(8, 23, 19, 0.45)",
      },
      keyframes: {
        pageIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "page-in": "pageIn 320ms ease-out",
      },
    },
  },
  plugins: [],
};
