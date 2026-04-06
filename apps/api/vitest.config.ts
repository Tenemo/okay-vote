import path from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        fileParallelism: false,
        include: ['test/**/*.test.ts'],
    },
    resolve: {
        alias: {
            config: path.resolve(__dirname, 'src/config.ts'),
            db: path.resolve(__dirname, 'src/db'),
            routes: path.resolve(__dirname, 'src/routes'),
            utils: path.resolve(__dirname, 'src/utils'),
        },
    },
});
