const path = require('path');

const OFF = 0;
const ERROR = 2;

const prettierRule = [
    ERROR,
    {
        useTabs: false,
        semi: true,
        singleQuote: true,
        jsxSingleQuote: false,
        trailingComma: 'all',
        arrowParens: 'always',
    },
];

module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'prettier',
        'plugin:prettier/recommended',
    ],
    plugins: [
        '@typescript-eslint',
        'import',
        'prettier',
        'react',
        'react-hooks',
        'jest',
        'jsx-a11y',
        'sql',
    ],
    parser: '@typescript-eslint/parser',
    env: {
        es6: true,
        node: true,
    },
    settings: {
        'import/resolver': {
            'babel-module': {},
            typescript: {
                project: [
                    './apps/web/tsconfig.json',
                    './apps/api/tsconfig.json',
                    './packages/contracts/tsconfig.json',
                ],
            },
        },
    },
    rules: {
        quotes: OFF,
        'prettier/prettier': prettierRule,
        'no-unused-vars': OFF,
        'arrow-parens': [ERROR, 'always', { requireForBlockBody: false }],
        'no-use-before-define': OFF,
        'no-restricted-exports': OFF,
        'import/no-extraneous-dependencies': [
            ERROR,
            { devDependencies: true },
        ],
        'import/prefer-default-export': OFF,
        'import/extensions': [
            ERROR,
            'ignorePackages',
            {
                js: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
            },
        ],
    },
    overrides: [
        {
            files: ['*.js'],
            rules: {
                '@typescript-eslint/no-var-requires': OFF,
            },
        },
        {
            files: ['apps/web/**/*.{ts,tsx}'],
            extends: [
                'plugin:@typescript-eslint/recommended',
                'plugin:@typescript-eslint/recommended-requiring-type-checking',
                'plugin:react/recommended',
                'plugin:jest/recommended',
                'plugin:jsx-a11y/strict',
                'airbnb',
                'airbnb/hooks',
                'prettier',
                'plugin:prettier/recommended',
            ],
            parserOptions: {
                project: './apps/web/tsconfig.json',
                tsconfigRootDir: __dirname,
                ecmaFeatures: {
                    jsx: true,
                },
                extraFileExtensions: ['.html', '.cjs'],
            },
            env: {
                browser: true,
                jest: true,
                node: true,
            },
            settings: {
                react: {
                    version: 'detect',
                },
            },
            rules: {
                quotes: OFF,
                'prettier/prettier': prettierRule,
                'no-unused-vars': OFF,
                'arrow-parens': [ERROR, 'always', { requireForBlockBody: false }],
                'no-use-before-define': OFF,
                'no-restricted-exports': OFF,
                'no-void': [ERROR, { allowAsStatement: true }],
                'react/prop-types': OFF,
                'react/prefer-stateless-function': OFF,
                'react/destructuring-assignment': [ERROR, 'always'],
                'react/jsx-filename-extension': [
                    ERROR,
                    {
                        extensions: ['.jsx', '.tsx'],
                    },
                ],
                'react/jsx-sort-props': ERROR,
                'react/jsx-props-no-spreading': OFF,
                'react/jsx-one-expression-per-line': OFF,
                'react/static-property-placement': [
                    ERROR,
                    'static public field',
                ],
                'react/state-in-constructor': [ERROR, 'never'],
                'react/display-name': [
                    ERROR,
                    {
                        ignoreTranspilerName: false,
                    },
                ],
                'react/function-component-definition': [
                    ERROR,
                    {
                        namedComponents: 'arrow-function',
                        unnamedComponents: 'arrow-function',
                    },
                ],
                'react-hooks/rules-of-hooks': ERROR,
                'react-hooks/exhaustive-deps': ERROR,
                'import/no-extraneous-dependencies': [
                    ERROR,
                    {
                        devDependencies: true,
                        packageDir: [path.join(__dirname, 'apps/web')],
                    },
                ],
                'import/prefer-default-export': OFF,
                'import/extensions': [
                    ERROR,
                    'ignorePackages',
                    {
                        js: 'never',
                        jsx: 'never',
                        ts: 'never',
                        tsx: 'never',
                    },
                ],
                'jsx-a11y/label-has-for': [
                    ERROR,
                    { required: { every: ['id'] } },
                ],
                '@typescript-eslint/explicit-function-return-type': [
                    ERROR,
                    {
                        allowExpressions: true,
                        allowTypedFunctionExpressions: true,
                    },
                ],
                '@typescript-eslint/explicit-module-boundary-types': ERROR,
                '@typescript-eslint/no-unused-vars': ERROR,
                '@typescript-eslint/no-use-before-define': ERROR,
                '@typescript-eslint/unbound-method': ERROR,
                '@typescript-eslint/member-delimiter-style': [
                    ERROR,
                    {
                        multiline: {
                            delimiter: 'semi',
                            requireLast: true,
                        },
                        singleline: {
                            delimiter: 'semi',
                            requireLast: false,
                        },
                    },
                ],
                'jest/no-commented-out-tests': ERROR,
            },
        },
        {
            files: ['apps/api/**/*.ts'],
            extends: [
                'plugin:@typescript-eslint/recommended',
                'plugin:@typescript-eslint/recommended-requiring-type-checking',
                'plugin:jest/recommended',
                'prettier',
                'plugin:prettier/recommended',
            ],
            parserOptions: {
                project: './apps/api/tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            env: {
                jest: true,
                node: true,
            },
            rules: {
                quotes: OFF,
                'prettier/prettier': prettierRule,
                'no-unused-vars': OFF,
                'arrow-parens': [ERROR, 'always', { requireForBlockBody: false }],
                'no-use-before-define': OFF,
                'no-restricted-exports': OFF,
                'import/no-extraneous-dependencies': [
                    ERROR,
                    {
                        devDependencies: true,
                        packageDir: [path.join(__dirname, 'apps/api')],
                    },
                ],
                'import/prefer-default-export': OFF,
                'import/extensions': [
                    ERROR,
                    'ignorePackages',
                    {
                        js: 'never',
                        jsx: 'never',
                        ts: 'never',
                        tsx: 'never',
                    },
                ],
                '@typescript-eslint/explicit-function-return-type': [
                    ERROR,
                    {
                        allowExpressions: true,
                        allowTypedFunctionExpressions: true,
                    },
                ],
                '@typescript-eslint/explicit-module-boundary-types': ERROR,
                '@typescript-eslint/no-unused-vars': ERROR,
                '@typescript-eslint/no-use-before-define': ERROR,
                '@typescript-eslint/unbound-method': ERROR,
                '@typescript-eslint/require-await': OFF,
                'jest/no-commented-out-tests': ERROR,
                'sql/format': [
                    OFF,
                    {
                        ignoreExpressions: false,
                        ignoreInline: true,
                        ignoreTagless: true,
                    },
                ],
                'sql/no-unsafe-query': [
                    ERROR,
                    {
                        allowLiteral: false,
                    },
                ],
            },
        },
        {
            files: ['packages/contracts/**/*.ts'],
            extends: [
                'plugin:@typescript-eslint/recommended',
                'plugin:@typescript-eslint/recommended-requiring-type-checking',
                'prettier',
                'plugin:prettier/recommended',
            ],
            parserOptions: {
                project: './packages/contracts/tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            rules: {
                quotes: OFF,
                'prettier/prettier': prettierRule,
                'no-unused-vars': OFF,
                'arrow-parens': [ERROR, 'always', { requireForBlockBody: false }],
                'no-use-before-define': OFF,
                'no-restricted-exports': OFF,
                'import/no-extraneous-dependencies': [
                    ERROR,
                    {
                        devDependencies: true,
                        packageDir: [path.join(__dirname, 'packages/contracts')],
                    },
                ],
                'import/prefer-default-export': OFF,
                'import/extensions': [
                    ERROR,
                    'ignorePackages',
                    {
                        js: 'never',
                        jsx: 'never',
                        ts: 'never',
                        tsx: 'never',
                    },
                ],
                '@typescript-eslint/explicit-function-return-type': [
                    ERROR,
                    {
                        allowExpressions: true,
                        allowTypedFunctionExpressions: true,
                    },
                ],
                '@typescript-eslint/explicit-module-boundary-types': ERROR,
                '@typescript-eslint/no-unused-vars': ERROR,
                '@typescript-eslint/no-use-before-define': ERROR,
                '@typescript-eslint/unbound-method': ERROR,
            },
        },
        {
            files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
            rules: {
                '@typescript-eslint/ban-ts-comment': OFF,
            },
        },
        {
            files: ['**/*Reducer.ts'],
            rules: {
                'default-param-last': OFF,
            },
        },
        {
            files: ['**/*.scss.d.ts'],
            rules: {
                'prettier/prettier': OFF,
            },
        },
    ],
};
