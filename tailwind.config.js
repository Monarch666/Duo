/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        warmth: {
          50: '#FDFCF9',
          100: '#FAF6EF',
          200: '#F5ECE0',
          300: '#EBD7C2',
          400: '#DDBFA2',
          500: '#C89D7A',
          600: '#B0805C',
          700: '#8C5E40',
          800: '#67442F',
          900: '#432C20',
        },
        rosewood: {
          50: '#FFF5F5',
          100: '#FFE8E8',
          200: '#FFD4D5',
          300: '#FCAEAF',
          400: '#F67A7D',
          500: '#EA4C53',
          600: '#D53039',
          700: '#B2222B',
          800: '#942027',
          900: '#7C2026',
        },
        blush: {
          light: '#FFF0ED',
          DEFAULT: '#FDE4DE',
          dark: '#E8A598',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E6EEE7',
          200: '#C6ECCA',
          500: '#5F8265',
          700: '#2D4E35',
          800: '#1D3523',
        },
        terracotta: {
          100: '#FBECE8',
          200: '#FFDBD2',
          500: '#C8644A',
          700: '#9C432C',
        },
        butter: '#FCF9EE',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Fraunces"', '"Playfair Display"', 'Georgia', 'serif'],
        handwriting: ['"Caveat"', 'cursive'],
        newsreader: ['"Newsreader"', 'serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(115, 65, 45, 0.05), 0 1px 2px rgba(115, 65, 45, 0.03)',
        'warm': '0 4px 16px -2px rgba(115, 65, 45, 0.08), 0 2px 6px -1px rgba(115, 65, 45, 0.04)',
        'warm-lg': '0 10px 25px -3px rgba(115, 65, 45, 0.1), 0 4px 10px -2px rgba(115, 65, 45, 0.05)',
      }
    },
  },
  plugins: [],
};
