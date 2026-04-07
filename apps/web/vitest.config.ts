import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
    viteConfig as Parameters<typeof mergeConfig>[0],
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
