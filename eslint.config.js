import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
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
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      // The pretext measurement lib ships no types; its surface is inherently `any`.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
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
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['src/lib/**/*.{js,ts}'],
    rules: { 'no-restricted-imports': ['error', { patterns: LIB_FORBIDDEN_IMPORTS }] },
  },
  {
    files: ['src/**/*.test.{js,jsx,ts,tsx}', 'src/test/**/*.{js,ts}'],
    languageOptions: { globals: { ...globals.vitest } },
  },
  prettier,
]