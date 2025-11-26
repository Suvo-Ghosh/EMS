/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // important
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xxs: "375px",
        xs: "540px",
      },
    }
  },
  plugins: []
};