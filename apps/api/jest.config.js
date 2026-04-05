module.exports = {
    roots: ['<rootDir>/test'],
    collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
    coveragePathIgnorePatterns: ['<rootDir>/src/server.ts'],
    modulePaths: ['<rootDir>/src'],
    moduleNameMapper: {
        '^@okay-vote/contracts$':
            '<rootDir>/../../packages/contracts/dist/index.js',
    },
    testEnvironment: 'node',
};
