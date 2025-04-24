import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { files: ['**/*.{js,mjs,cjs,ts}'], languageOptions: { globals: globals.browser } },
  { files: ['**/*.{js,mjs,cjs,ts}'], plugins: { js }, extends: ['js/recommended'] },
  { ignores: ['dist', 'docs', 'examples', 'scripts', 'vendor', 'test'] },
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      // ------------------ general ------------------ //
      eqeqeq: 'warn',

      // ------------------ typescript ------------------
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: ['.*'],
        },
      ],
    },
  },
]);
