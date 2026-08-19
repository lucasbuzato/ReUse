/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "reuse-green": "#2F7D5A",
        "reuse-greenDark": "#20563E",
        "reuse-greenLight": "#E8F5EE",
      },
    },
  },
  plugins: [],
};