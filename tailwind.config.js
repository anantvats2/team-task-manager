/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        success: '#16a34a',
        warning: '#eab308',
        danger: '#dc2626',
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(15, 23, 42, 0.15)',
      },
    },
  },
  plugins: [],
}

