/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'italia-blue': '#0066CC',
        'italia-dark': '#1C2024',
        'italia-bg': '#F0F1F2',
      },
      fontFamily: {
        sans: ['"Titillium Web"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
