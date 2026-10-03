import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.js'],
      exclude: ['src/**/*.test.js'],
      // Correctness lives in lib/. Thresholds are deliberately enforced there and
      // nowhere else: component tests exist to catch behaviour regressions, not
      // to chase a number.
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 80 },
      reporter: ['text', 'html'],
    },
  },
})
