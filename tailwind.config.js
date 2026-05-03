/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef7ff",
          100: "#d9ecff",
          200: "#b9dcff",
          300: "#8bc4ff",
          400: "#56a5ff",
          500: "#3186fb",
          600: "#1f6ae0",
          700: "#1c55b3",
          800: "#1c498f",
          900: "#1c3f73",
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Sarabun', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
