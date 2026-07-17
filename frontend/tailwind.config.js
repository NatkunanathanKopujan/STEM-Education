/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
        },
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        page: 'rgb(var(--color-page) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        elevated: 'rgb(var(--color-elevated) / <alpha-value>)',
        subtle: 'rgb(var(--color-subtle) / <alpha-value>)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
