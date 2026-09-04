/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dfl: {
          bg: '#0a0d14',
          card: '#121824',
          cardHover: '#182030',
          border: '#1f293d',
          gold: '#f59e0b',
          cyan: '#06b6d4',
          emerald: '#10b981',
          rose: '#f43f5e',
        }
      },
      boxShadow: {
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
      }
    },
  },
  plugins: [],
}
