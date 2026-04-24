import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Enforce explicit return types on exported functions
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      // Ban any — use unknown + Zod parsing instead (see ENGINEERING_RULES.md)
      '@typescript-eslint/no-explicit-any': 'error',
      // Prevent unused variables from accumulating silently
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Note: @typescript-eslint/no-floating-promises requires type-aware linting.
      // Enable it by adding parserOptions.project once the team configures typed linting.
    },
  },
]

export default eslintConfig
