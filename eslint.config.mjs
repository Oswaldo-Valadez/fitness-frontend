import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import chaiFriendly from 'eslint-plugin-chai-friendly'

export default [
  {
    ignores: ['dist', 'node_modules', 'build', 'public'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2021,
        sourceType: 'module',
        project: ['./tsconfig.eslint.json'],
      },
      globals: {
        axios: 'readonly',
        _: 'readonly',
      },
    },
    plugins: {
      prettier,
      react,
      reactHooks,
      '@typescript-eslint': typescriptEslint,
      'chai-friendly': chaiFriendly,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          useTabs: false,
          semi: false,
          tabWidth: 4,
          printWidth: 160,
          singleQuote: true,
          jsxSingleQuote: true,
          trailingComma: 'all',
          bracketSpacing: true,
          bracketSameLine: false,
          arrowParens: 'avoid',
          endOfLine: 'auto',
        },
      ],
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],
      'no-new': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'react/prop-types': 'off',
      'react/jsx-filename-extension': [
        'warn',
        {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      ],
      'react/self-closing-comp': 'error',
      'array-callback-return': 'off',
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
        },
      ],
      'chai-friendly/no-unused-expressions': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // ✅ E2E override
  {
    files: ['e2e/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: ['./tsconfig.e2e.json']
      }
    }
  }
]
