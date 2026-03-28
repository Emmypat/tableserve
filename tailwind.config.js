/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: {
          deep:    '#4A0010',
          DEFAULT: '#6B0F1A',
          mid:     '#8B1A2E',
          light:   '#B03A4E',
          pale:    '#F5E6E8',
        },
        gold: {
          DEFAULT: '#D4AF37',
          warm:    '#C4973B',
          light:   '#E8D5A3',
          pale:    '#FDF8EE',
          dark:    '#A88A1E',
        },
        cream: {
          DEFAULT: '#FAF7F4',
          warm:    '#FDF8F0',
          border:  '#E8E0D8',
        },
        brown: {
          DEFAULT: '#2C1810',
          muted:   '#8B7355',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
