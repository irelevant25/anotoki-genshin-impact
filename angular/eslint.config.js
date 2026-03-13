import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';

// Import your local rules
import localRules from './eslint-local-rules.js';

export default tseslint.config(
  {
    ignores: [
      '.angular/',
      'node_modules/',
      'dist/',
      'coverage/',
      'storybook-static/',
      '**/*.stories.*',
      '*.js',
      'src/app/generated/'
    ]
  },
  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-else-return': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
      '@typescript-eslint/no-useless-constructor': 'off',
      'no-undef-init': 'error',
      '@typescript-eslint/no-use-before-define': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'curly': ['error', 'all'],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'classProperty',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require'
        },
        {
          selector: 'parameterProperty',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require'
        }
      ]
    }
  },
  // HTML template files configuration - SEPARATE from TypeScript
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularTemplate,
      'local': {
        rules: localRules,
      },
    },
    rules: {
      // Only template-specific rules here
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
      'local/no-config-component-direct-inputs': 'error',
    },
  },
);
