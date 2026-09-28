/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
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
