import path from 'path';
import { fileURLToPath } from 'url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';

import { resolveApiProxyTarget } from './config/api-base-url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_DEV_HOST = '0.0.0.0';
const DEFAULT_DEV_PORT = 3000;
const DEFAULT_PREVIEW_PORT = 4173;

const parsePort = (value: string | undefined, fallback: number): number => {
    const parsedPort = Number.parseInt(value ?? `${fallback}`, 10);

    return Number.isNaN(parsedPort) ? fallback : parsedPort;
};

const resolveFromRoot = (...segments: string[]): string =>
    path.resolve(rootDir, ...segments);

const resolveFromSrc = (...segments: string[]): string =>
    resolveFromRoot('src', ...segments);

const webHost = process.env.WEB_HOST ?? DEFAULT_DEV_HOST;
const webPort = parsePort(process.env.WEB_PORT, DEFAULT_DEV_PORT);
const previewPort = parsePort(process.env.PREVIEW_PORT, DEFAULT_PREVIEW_PORT);

const apiProxyTarget = resolveApiProxyTarget(process.env.VITE_API_BASE_URL);
const plugins: PluginOption[] = [
    react() as unknown as PluginOption,
    tailwindcss() as unknown as PluginOption,
];

const getManualChunk = (id: string): string | undefined => {
    const normalizedId = id.replaceAll('\\', '/');

    if (!normalizedId.includes('/node_modules/')) {
        return undefined;
    }

    return 'vendor';
};

export default defineConfig({
    plugins,
    resolve: {
        alias: {
            '@': resolveFromSrc(),
            '@okay-vote/contracts': resolveFromRoot(
                '../../packages/contracts/src/index.ts',
            ),
            components: resolveFromSrc('components'),
            fonts: resolveFromSrc('fonts'),
            store: resolveFromSrc('store'),
            typings: resolveFromSrc('typings'),
            utils: resolveFromSrc('utils'),
        },
    },
    server: {
        host: webHost,
        port: webPort,
        strictPort: true,
        proxy: {
            '/api': {
                target: apiProxyTarget,
                changeOrigin: true,
            },
        },
    },
    preview: {
        host: webHost,
        port: previewPort,
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks: getManualChunk,
            },
        },
    },
});
