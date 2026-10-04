import defaultTheme from 'tailwindcss/defaultTheme'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Variable', 'Geist', ...defaultTheme.fontFamily.sans],
        mono: ['Geist Mono Variable', 'Geist Mono', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [forms],
}
