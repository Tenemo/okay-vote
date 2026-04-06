import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

const resolveFromRoot = (...segments: string[]): string =>
    path.resolve(rootDir, ...segments);

const resolveFromSrc = (...segments: string[]): string =>
    resolveFromRoot('src', ...segments);

const externalPackages = new Set([
    '@fastify/cors',
    'dotenv',
    'fastify',
    'gmean',
    'http-errors',
    'pg',
]);

const isExternalDependency = (id: string): boolean =>
    builtinModules.includes(id) ||
    id.startsWith('node:') ||
    externalPackages.has(id) ||
    id.startsWith('drizzle-orm');

export default defineConfig({
    resolve: {
        alias: {
            '@okay-vote/contracts': resolveFromRoot(
                '../../packages/contracts/src/index.ts',
            ),
            config: resolveFromSrc('config.ts'),
            db: resolveFromSrc('db'),
            routes: resolveFromSrc('routes'),
            utils: resolveFromSrc('utils'),
        },
    },
    build: {
        outDir: 'dist',
        target: 'node24',
        minify: false,
        sourcemap: true,
        ssr: true,
        rollupOptions: {
            input: {
                server: resolveFromSrc('start-server.ts'),
                'scripts/migrate-db': resolveFromSrc('scripts/migrate-db.ts'),
            },
            external: isExternalDependency,
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: 'chunks/[name]-[hash].js',
                format: 'es',
            },
        },
    },
    ssr: {
        noExternal: ['@okay-vote/contracts'],
    },
});
