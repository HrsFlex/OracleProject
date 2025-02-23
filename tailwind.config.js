/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        oracle: {
          red: '#C74634',
          darkred: '#A23B2A',
          gray: '#312D2A',
          lightgray: '#F8F8F8'
        }
      }
    },
  },
  plugins: [],
};