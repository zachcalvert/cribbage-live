/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          DEFAULT: '#0d5c2f',
          dark: '#0a4a26',
          light: '#107a3e',
        },
        card: {
          red: '#dc2626',
          black: '#1f2937',
        },
      },
    },
  },
  plugins: [],
};
