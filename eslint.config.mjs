import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import chaiFriendly from 'eslint-plugin-chai-friendly'

export default [
  {
    ignores: ['dist', 'node_modules', 'build', 'public', 'src/api/generated'],
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
      // Keyed as 'react-hooks'/'react-refresh' (not the camelCase import name) so that
      // `react-hooks/*` and `react-refresh/*` disable-comments across the codebase
      // actually resolve to these plugins' rules.
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': typescriptEslint,
      'chai-friendly': chaiFriendly,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          useTabs: false,
          semi: false,
          tabWidth: 2,
          printWidth: 160,
          singleQuote: true,
          jsxSingleQuote: false,
          trailingComma: 'all',
          bracketSpacing: true,
          bracketSameLine: false,
          arrowParens: 'always',
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
      // Disabled: eslint-plugin-react@7.37.5's jsx-filename-extension rule still calls the
      // removed ESLint 8 API `context.getFilename()`, which crashes under ESLint 10.4.1.
      // Re-enable once the plugin ships an ESLint 10-compatible release.
      'react/jsx-filename-extension': 'off',
      'react/self-closing-comp': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-refresh/only-export-components': 'warn',
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
