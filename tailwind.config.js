/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          dark: '#1B4332',
          mid: '#2D6A4F',
          light: '#40916C',
          pale: '#D8F3DC',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F0D060',
          dark: '#A88A1E',
          pale: '#FDF6DC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
