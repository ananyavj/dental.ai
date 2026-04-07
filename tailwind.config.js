/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        // Semantic aliases used throughout
        'bg-light': '#F9FAFB',
        'surface-light': '#FFFFFF',
        'border-light': '#E5E7EB',
        'bg-dark': '#0C0C0C',
        'surface-dark': '#161616',
        'border-dark': '#2A2A2A',
        'text-primary-light': '#111827',
        'text-primary-dark': '#F9FAFB',
        'text-muted-light': '#6B7280',
        'text-muted-dark': '#9CA3AF',
        // Legacy dental aliases (keeps old components working)
        dental: {
          blue: '#2563EB',
          'blue-light': '#EFF6FF',
          'blue-dark': '#1D4ED8',
          red: '#EF4444',
          amber: '#F59E0B',
          green: '#10B981',
          'red-light': '#FEF2F2',
          'amber-light': '#FFFBEB',
          'green-light': '#F0FDF4',
          text: '#111827',
          'text-secondary': '#6B7280',
          surface: '#F9FAFB',
          border: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        card: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        panel: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'dot-bounce': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        'fade-in': 'fade-in 0.2s ease forwards',
        'slide-in': 'slide-in 0.2s ease forwards',
        'dot-bounce': 'dot-bounce 1.4s infinite ease-in-out both',
      },
    },
  },
  plugins: [],
}
