/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ctp: {
          crust: '#070709',
          mantle: '#0c0c0f',
          base: '#09090b',
          surface0: '#17171c',
          surface1: '#24242b',
          surface2: '#34343e',
          overlay0: '#52525b',
          overlay1: '#71717a',
          subtext0: '#8b8b95',
          subtext1: '#b4b4be',
          text: '#f4f4f6',
          lavender: '#d4d4d8',
          blue: '#38bdf8',
          sapphire: '#0ea5e9',
          sky: '#7dd3fc',
          teal: '#2dd4bf',
          green: '#10b981',
          yellow: '#f59e0b',
          peach: '#f97316',
          maroon: '#f43f5e',
          red: '#ef4444',
          mauve: '#e4e4e7',
          pink: '#a1a1aa',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
