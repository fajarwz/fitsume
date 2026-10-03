import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

/**
 * src/lib/** is the bottom layer: pure functions, no framework, no knowledge of
 * anything above it. Enforced here rather than by convention, so the rule cannot
 * quietly rot.
 */
const LIB_FORBIDDEN_IMPORTS = [
  {
    group: ['react', 'react-dom', 'react/*', 'react-dom/*', 'react-router', 'react-router-dom'],
    message: 'src/lib/ is framework-free: no React, no router. Keep it to pure functions and data.',
  },
  {
    group: ['**/hooks/**', '**/components/**', '**/pages/**', '**/state/**'],
    message: 'src/lib/ must not import from higher layers (hooks, components, pages, state).',
  },
]

export default [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // React 19 with the automatic JSX runtime: no React import needed in scope.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/lib/**/*.js'],
    rules: { 'no-restricted-imports': ['error', { patterns: LIB_FORBIDDEN_IMPORTS }] },
  },
  {
    files: ['src/**/*.test.{js,jsx}', 'src/test/**/*.js'],
    languageOptions: { globals: { ...globals.vitest } },
  },
  prettier,
]
