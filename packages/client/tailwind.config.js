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
      keyframes: {
        'score-pop': {
          '0%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
          '50%': {
            opacity: '1',
            transform: 'translateY(-10px) scale(1.2)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-20px) scale(1)',
          },
        },
      },
      animation: {
        'score-pop': 'score-pop 1.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
