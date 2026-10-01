/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        banking: {
          bg: '#0F172A',       // Deep navy background
          card: '#1E293B',     // Slate card background
          accent: '#0D9488',   // Teal theme color
          accentLight: '#14B8A6',
          border: '#334155',
          textMuted: '#94A3B8',
          success: '#10B981',  // Emerald
          danger: '#EF4444',   // Red
          warning: '#F59E0B'   // Amber
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
