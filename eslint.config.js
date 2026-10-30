import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/.wrangler',
    'worker/worker-configuration.d.ts',
    // Pliki pdf.js kopiowane przez web/scripts/copy-pdfjs.mjs
    'web/public/pdfjs',
    // Eksport z Claude Design i lokalne skille agentów
    'design',
    '.agents',
  ]),
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      // Twarde zasady z CLAUDE.md
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML jest zakazane.',
        },
      ],
    },
  },
  {
    files: ['web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['worker/**/*.ts'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ['*.js', 'web/vite.config.ts', 'web/scripts/**'],
    languageOptions: { globals: globals.node },
  },
  // Na końcu: wyłącza reguły stylu, którymi zajmuje się Prettier
  prettier,
])
