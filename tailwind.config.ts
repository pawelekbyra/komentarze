import type { Config } from "tailwindcss"

const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7c3aed',
          foreground: '#ffffff',
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
} satisfies Config

export default config
