module.exports = {
    collectCoverageFrom: ['<rootDir>/src/**/*{js,jsx,ts,tsx}'],
    coveragePathIgnorePatterns: ['<rootDir>/src/index.tsx'],
    setupFilesAfterEnv: ['<rootDir>/config/testSetup.ts'],
    modulePaths: ['<rootDir>/src'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|ico|woff|woff2|svg|ttf|eot)$':
            '<rootDir>/config/assetsTransformer.ts',
        '^.+\\.(css|scss)$': '<rootDir>/config/assetsTransformer.ts',
    },
    testEnvironment: 'jsdom',
};
