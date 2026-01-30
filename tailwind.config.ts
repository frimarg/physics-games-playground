import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F7F0E6',
        border: '#D9D9D9',
        navy: '#102544',
        dark: {
          bg: '#1a1a2e',
          surface: '#16213e',
          accent: '#e94560',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config
