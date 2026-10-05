import js from '@eslint/js';
import globals from 'globals';
export default [
  {ignores:['build/**','dist/**','.vercel/**','.next/**','test-results/**','playwright-report/**']},
  js.configs.recommended,
  {files:['**/*.mjs','**/*.js'],languageOptions:{globals:{...globals.node,...globals.browser}},rules:{'no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]}},
];
