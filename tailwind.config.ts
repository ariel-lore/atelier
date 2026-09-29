import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        mute: "#6b6b73",
        line: "#ebebed",
        soft: "#f7f7f8",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        phone: "390px",
      },
    },
  },
  plugins: [],
};

export default config;
