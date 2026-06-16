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
        kakao: {
          yellow: "#FEE500",
          "yellow-dark": "#FAD900",
          brown: "#3C1E1E",
          "chat-bg": "#B2C7D9",
          "bubble-sent": "#FFEB33",
          "bubble-received": "#FFFFFF",
          gray: "#949494",
          "light-gray": "#F4F4F4",
          header: "#F5F5F5",
        },
      },
      fontFamily: {
        sans: [
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      borderRadius: {
        "bubble": "18px",
        "bubble-sm": "14px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.3s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        "pulse-dot-1": "pulse-dot 1.4s ease-in-out infinite 0s",
        "pulse-dot-2": "pulse-dot 1.4s ease-in-out infinite 0.2s",
        "pulse-dot-3": "pulse-dot 1.4s ease-in-out infinite 0.4s",
      },
    },
  },
  plugins: [],
};
export default config;
