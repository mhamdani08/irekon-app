import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "rgb(0, 103, 71)",
          hover: "rgb(0, 85, 58)",
          light: "rgba(0, 103, 71, 0.08)",
          border: "rgba(0, 103, 71, 0.2)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
