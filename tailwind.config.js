/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // This tells Tailwind to look for the "dark" class on <html>
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}