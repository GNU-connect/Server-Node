import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactNativePlugin from 'eslint-plugin-react-native';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  // 기본 JS 규칙
  js.configs.recommended,

  // TypeScript 규칙
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },

    plugins: {
      react: reactPlugin,
      'react-native': reactNativePlugin,
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      // react
      ...reactPlugin.configs.recommended.rules,
      // React 17+ 새로운 JSX 변환 사용 시 import React 불필요
      ...reactPlugin.configs['jsx-runtime'].rules,

      // react-native
      ...reactNativePlugin.configs.all.rules,

      // prettier
      'prettier/prettier': 'error',
    },
  },
];
