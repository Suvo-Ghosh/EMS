/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // important
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "540px",
      },
    }
  },
  plugins: []
};