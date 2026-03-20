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
          50:  '#eef0ff',
          100: '#dce0ff',
          200: '#b9c1ff',
          300: '#8d9eff',
          400: '#6a82f5',
          500: '#4a65ee',
          600: '#2b47e3',
          700: '#1a32c8',
          800: '#0d1ea8',
          900: '#0B0E92',  // brand dark navy
        },
        brand: {
          dark:  '#0B0E92',
          light: '#69A6F0',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #0B0E92, #69A6F0)',
        'brand-gradient-135': 'linear-gradient(135deg, #0B0E92, #69A6F0)',
        'brand-gradient-b': 'linear-gradient(to bottom, #0B0E92, #69A6F0)',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
