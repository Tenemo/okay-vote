const path = require('path');

const js = require('@eslint/js');
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const sqlPlugin = require('eslint-plugin-sql').default;

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

const importRules = {
    ...importPlugin.configs.errors.rules,
    ...importPlugin.configs.warnings.rules,
    ...importPlugin.configs.typescript.rules,
};

const typeCheckedRules = {
    ...tsPlugin.configs['flat/recommended-type-checked'][1].rules,
    ...tsPlugin.configs['flat/recommended-type-checked'][2].rules,
};

const importSettings = {
    'import/resolver': {
        typescript: {
            noWarnOnMultipleProjects: true,
            project: [
                './apps/web/tsconfig.json',
                './apps/api/tsconfig.json',
                './packages/contracts/tsconfig.json',
                './packages/testkit/tsconfig.json',
                './netlify/edge-functions/tsconfig.json',
            ],
        },
    },
};

const commonRules = {
    ...importRules,
    ...prettierRecommended.rules,
    quotes: OFF,
    'prettier/prettier': prettierRule,
    'no-unused-vars': OFF,
    'arrow-parens': [ERROR, 'always', { requireForBlockBody: false }],
    'no-use-before-define': OFF,
    'no-restricted-exports': OFF,
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
};

const createTypeScriptConfig = ({
    files,
    packageDir,
    extraGlobals = {},
    extraRules = {},
    react = false,
    jsx = false,
    sql = false,
}) => ({
    files,
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            projectService: true,
            tsconfigRootDir: __dirname,
            ecmaFeatures: jsx ? { jsx: true } : {},
        },
        globals: {
            ...globals.node,
            ...extraGlobals,
        },
    },
    plugins: {
        '@typescript-eslint': tsPlugin,
        import: importPlugin,
        prettier: prettierPlugin,
        ...(react ? { react: reactPlugin } : {}),
        ...(react ? { 'react-hooks': reactHooksPlugin } : {}),
        ...(react ? { 'jsx-a11y': jsxA11yPlugin } : {}),
        ...(sql ? { sql: sqlPlugin } : {}),
    },
    settings: {
        ...importSettings,
        ...(react ? { react: { version: 'detect' } } : {}),
    },
    rules: {
        ...commonRules,
        ...typeCheckedRules,
        ...(react ? reactPlugin.configs.flat.recommended.rules : {}),
        ...(react ? reactHooksPlugin.configs.flat.recommended.rules : {}),
        ...(react ? jsxA11yPlugin.configs.strict.rules : {}),
        'import/no-extraneous-dependencies': [
            ERROR,
            {
                devDependencies: true,
                packageDir: [packageDir],
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
        ...extraRules,
    },
});

module.exports = [
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/coverage/**',
            '.turbo/**',
            '.tmp/**',
            'temp/**',
        ],
    },
    js.configs.recommended,
    {
        files: ['**/*.{js,cjs,mjs}'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            import: importPlugin,
            prettier: prettierPlugin,
        },
        settings: importSettings,
        rules: {
            ...commonRules,
            'import/no-extraneous-dependencies': [
                ERROR,
                { devDependencies: true },
            ],
        },
    },
    createTypeScriptConfig({
        files: ['apps/web/src/**/*.tsx'],
        packageDir: path.join(__dirname, 'apps/web'),
        extraGlobals: {
            ...globals.browser,
            ...globals.vitest,
        },
        react: true,
        jsx: true,
        extraRules: {
            'no-void': [ERROR, { allowAsStatement: true }],
            'react/prop-types': OFF,
            'react/react-in-jsx-scope': OFF,
            'react/jsx-uses-react': OFF,
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
            'jsx-a11y/label-has-for': [
                ERROR,
                { required: { every: ['id'] } },
            ],
            'jsx-a11y/no-autofocus': OFF,
        },
    }),
    createTypeScriptConfig({
        files: [
            'apps/web/*.ts',
            'apps/web/src/**/*.ts',
            'apps/web/config/**/*.ts',
        ],
        packageDir: path.join(__dirname, 'apps/web'),
        extraGlobals: {
            ...globals.browser,
        },
        extraRules: {
            'no-void': [ERROR, { allowAsStatement: true }],
        },
    }),
    createTypeScriptConfig({
        files: ['apps/api/**/*.ts'],
        packageDir: path.join(__dirname, 'apps/api'),
        extraGlobals: globals.vitest,
        sql: true,
        extraRules: {
            '@typescript-eslint/require-await': OFF,
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
    }),
    createTypeScriptConfig({
        files: ['packages/contracts/**/*.ts'],
        packageDir: path.join(__dirname, 'packages/contracts'),
    }),
    createTypeScriptConfig({
        files: ['packages/testkit/**/*.ts'],
        packageDir: path.join(__dirname, 'packages/testkit'),
    }),
    createTypeScriptConfig({
        files: ['netlify/edge-functions/**/*.ts'],
        packageDir: __dirname,
    }),
    {
        files: [
            '**/*.spec.ts',
            '**/*.spec.tsx',
            '**/*.test.ts',
            '**/*.test.tsx',
        ],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.vitest,
            },
        },
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
];
