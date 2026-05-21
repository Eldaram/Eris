import js from '@eslint/js';
import globals from 'globals';
import vue from 'eslint-plugin-vue';

export default [
    {
        ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
    },
    js.configs.recommended,
    ...vue.configs['flat/recommended'],
    {
        files: ['**/*.{js,vue}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest,
                describe: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                beforeEach: 'readonly',
                afterAll: 'readonly',
                afterEach: 'readonly',
                it: 'readonly',
                test: 'readonly',
                vi: 'readonly',
            },
        },
    },
    {
        rules: {
            'no-empty': ['error', { allowEmptyCatch: true }],
        },
    },
];