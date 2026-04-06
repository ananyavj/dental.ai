/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f3fc',
          100: '#c5dff6',
          200: '#9ecaef',
          300: '#71b3e8',
          400: '#4ea1e3',
          500: '#1a6fa8',
          600: '#165f92',
          700: '#114d78',
          800: '#0c3b5e',
          900: '#072944',
        },
        dental: {
          blue: '#1a6fa8',
          'blue-light': '#e8f3fc',
          'blue-dark': '#114d78',
          red: '#dc2626',
          amber: '#d97706',
          green: '#16a34a',
          'red-light': '#fef2f2',
          'amber-light': '#fffbeb',
          'green-light': '#f0fdf4',
          text: '#1a1a2e',
          'text-secondary': '#64748b',
          surface: '#f8fafc',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'panel': '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
      }
    },
  },
  plugins: [],
}
