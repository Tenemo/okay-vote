import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

const baseViteConfig = viteConfig;

export default mergeConfig(
    baseViteConfig,
    defineConfig({
        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: ['./config/testSetup.ts'],
            include: ['src/**/*.{spec,test}.{ts,tsx}'],
            css: true,
        },
    }),
);
