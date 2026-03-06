/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f0f13',
        bloodRed: '#8a0303',
        magicBlue: '#0f4c81',
      }
    },
  },
  plugins: [],
}

