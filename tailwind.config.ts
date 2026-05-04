import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        brutal: "8px 8px 0px #111111",
        brutalSm: "4px 4px 0px #111111"
      }
    }
  },
  plugins: []
};

export default config;
