/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        green: {
          900: "#123d2d",
          700: "#1a684e",
          600: "#1f7a5c",
          300: "#cdead9",
          100: "#e8f2ec",
          50: "#f0f7f3",
        },
        sun: { 500: "#f2b134", 300: "#fbdd94" },
        coral: { 500: "#e0785a", 100: "#fbe6de" },
        ink: "#1b201c",
        slate: { 700: "#33403a" },
        gray: { 500: "#55605a", 400: "#8a938c" },
        line: { 300: "#d9dcd5", 200: "#e1e0d8", 100: "#ece9e0" },
        paper: { 100: "#f7f6f2", 50: "#fbfbf9" },
        success: "#1f7a5c",
        warning: "#e6a521",
        danger: "#b23b3b",
        info: "#2b6cb0",
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      borderRadius: { sm: "8px", md: "11px", lg: "16px", xl: "20px" },
      boxShadow: {
        sm: "0 1px 3px rgba(27,32,28,.06)",
        md: "0 4px 14px rgba(27,32,28,.10)",
        lg: "0 12px 30px rgba(27,32,28,.16)",
        brand: "0 4px 14px rgba(31,122,92,.24)",
      },
    },
  },
  plugins: [],
};
