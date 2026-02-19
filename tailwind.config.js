/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#137fec",
        "primary-hover": "#3b82f6",
        "bg-dark": "#101922",
        "bg-darker": "#0d1520",
        "surface": "#17222e",
        "surface-2": "#1c2d3e",
        "surface-3": "#243547",
        "border-color": "#233648",
        "border-primary": "rgba(19,127,236,0.35)",
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(circle at 50% 50%, rgba(19,127,236,0.15) 0%, rgba(15,23,42,0) 70%)",
        "mesh": "url(\"data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)' /%3E%3C/svg%3E\")",
      },
      boxShadow: {
        "primary-glow": "0 0 20px rgba(19,127,236,0.3)",
        "primary-glow-lg": "0 0 40px rgba(19,127,236,0.4)",
        "card": "0 4px 32px rgba(0,0,0,0.3)",
      },
      animation: {
        "ping-slow": "ping 2s cubic-bezier(0,0,0.2,1) infinite",
        "fade-in-up": "fadeInUp 0.6s ease forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(30px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
}
