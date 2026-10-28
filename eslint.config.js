import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
    },
  },
  // The item contract puts v-bind="$attrs" last on an example's component, after its events.
  {
    files: ['packages/registry/**/*.example.vue'],
    rules: { 'vue/attributes-order': 'off' },
  },
  {
    files: ['packages/library-contract/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    ignores: [
      // The preview canvas runs its own eslint 10 config
      'apps/docs/**',
      // Import folder contains unprocessed components for migration
      'import/**',
      // Standard ignores
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/coverage/**',
      '**/.wrangler/**',
      '**/.frontic/**',
      '**/.contract/**',
      // Contract fixtures: the bad item is wrong on purpose
      'packages/registry/tests/contract/fixtures/**',
    ],
  },
)
