import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

const resolveFromRoot = (...segments: string[]): string =>
    path.resolve(rootDir, ...segments);

const resolveFromSrc = (...segments: string[]): string =>
    resolveFromRoot('src', ...segments);

const getManualChunk = (id: string): string | undefined => {
    if (!id.includes('node_modules')) {
        return undefined;
    }

    if (id.includes('@mui/icons-material')) {
        return 'mui-icons';
    }

    if (
        (id.includes('@mui/') && !id.includes('@mui/icons-material')) ||
        id.includes('@emotion/')
    ) {
        return 'mui-core';
    }

    return 'vendor';
};

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, rootDir, '');

    if (
        command === 'build' &&
        process.env.NETLIFY &&
        !env.VITE_API_BASE_URL?.trim()
    ) {
        throw new Error(
            'VITE_API_BASE_URL must point at the Railway API origin.',
        );
    }

    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@okay-vote/contracts': resolveFromRoot(
                    '../../packages/contracts/src/index.ts',
                ),
                components: resolveFromSrc('components'),
                fonts: resolveFromSrc('fonts'),
                store: resolveFromSrc('store'),
                styles: resolveFromSrc('styles'),
                typings: resolveFromSrc('typings'),
                utils: resolveFromSrc('utils'),
            },
        },
        server: {
            host: '0.0.0.0',
            port: 3000,
            strictPort: true,
            proxy: {
                '/api': {
                    target: 'http://127.0.0.1:4000',
                    changeOrigin: true,
                },
            },
        },
        preview: {
            host: '0.0.0.0',
            port: 4173,
        },
        build: {
            outDir: 'dist',
            rollupOptions: {
                output: {
                    manualChunks: getManualChunk,
                },
            },
        },
    };
});
