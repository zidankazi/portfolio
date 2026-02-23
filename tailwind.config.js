/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        anthropic: {
          bg: '#FCFBF9',
          text: '#333333',
          border: '#E5E5E5',
          sage: '#A3B19B',
          sand: '#E3D9C6'
        },
        ink: {
          950: '#070707',
          900: '#0b0b0c',
          800: '#111113',
          700: '#17181a',
          600: '#232429',
          500: '#2c2d34',
          300: '#b7b9c2',
          200: '#d7d9e1',
          100: '#f2f3f6'
        },
        chrome: {
          500: '#8c8f98',
          400: '#b2b5bd'
        }
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
