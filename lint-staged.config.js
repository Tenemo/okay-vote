module.exports = {
    'apps/web/**/*.{ts,tsx}': () => [
        'pnpm exec eslint --fix apps/web --ext ts,tsx',
        'pnpm exec prettier --write apps/web',
        'pnpm exec tsc --build --force apps/web/tsconfig.json',
    ],
    'apps/api/**/*.ts': () => [
        'pnpm exec eslint --fix apps/api --ext ts',
        'pnpm exec prettier --write apps/api',
        'pnpm exec tsc --build --force apps/api/tsconfig.json',
    ],
    'packages/contracts/**/*.ts': () => [
        'pnpm exec eslint --fix packages/contracts --ext ts',
        'pnpm exec prettier --write packages/contracts',
        'pnpm exec tsc --build --force packages/contracts/tsconfig.json',
    ],
    'packages/testkit/**/*.ts': () => [
        'pnpm exec eslint --fix packages/testkit --ext ts',
        'pnpm exec prettier --write packages/testkit',
        'pnpm exec tsc --build --force packages/testkit/tsconfig.json',
    ],
};
