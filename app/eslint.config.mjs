// ESLint 9 flat config.
//
// Replaces .eslintrc.json (ESLint 8 + eslint-config-airbnb + eslint-config-airbnb-typescript,
// neither of which supports flat config / ESLint 9, and airbnb-typescript is archived).
// `eslint-config-airbnb-extended/legacy` is a flat port of exactly those two presets,
// so the rule set is unchanged. ESLint 10 is not used yet because
// eslint-config-airbnb-extended and eslint-plugin-react-native only support ESLint <= 9.
import { configs as airbnb } from 'eslint-config-airbnb-extended/legacy';
import react from 'eslint-plugin-react';
import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'ios/**', 'android/**', '.expo/**', 'dist/**'],
  },
  // Same order as the old `extends`: react/recommended, airbnb, airbnb-typescript,
  // (import/typescript is covered by airbnb-typescript's settings), react/jsx-runtime.
  react.configs.flat.recommended,
  ...airbnb.react.recommended,
  ...airbnb.react.typescript,
  react.configs.flat['jsx-runtime'],
  {
    plugins: {
      'react-native': reactNative,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
        ...reactNative.environments['react-native'].globals,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'no-shadow': 'off',
      'react/require-default-props': 'off',
      'import/extensions': [
        'error',
        'never',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
          // JSON imports keep their extension (ESLint 8 never resolved .json, so never checked).
          json: 'always',
        },
      ],
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^firebase-admin/.+'],
        },
      ],
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'no-console': 'off',
    },
  },
  {
    // Resolve like Metro (source extensions before .json): `../firebase` is firebase.js,
    // not the sibling firebase.json. The old ESLint 8 settings did not resolve .json at all.
    settings: {
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.d.ts', '.json'] },
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-shadow': ['error'],
      // airbnb-typescript's options; caughtErrors pinned to the typescript-eslint v5
      // default ('none') that the old config used (v8 changed the default to 'all').
      '@typescript-eslint/no-unused-vars': ['error', {
        vars: 'all', args: 'after-used', ignoreRestSiblings: true, caughtErrors: 'none',
      }],
    },
  },
];
