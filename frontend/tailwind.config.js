/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef0ff',
          100: '#dfe3ff',
          200: '#c5cbff',
          300: '#a3a6fc',
          400: '#8180f8',
          500: '#6b38d4',
          600: '#4f46e5',
          700: '#3525cd',
          800: '#2c1fa8',
          900: '#251b85',
          950: '#160e4a',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        icons: ['"Material Symbols Outlined"', 'sans-serif'],
      },
      spacing: {
        7: '1.75rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
        88: '22rem',
        128: '32rem',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
        lift: '0 10px 40px -10px rgba(53, 37, 205, 0.15)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
