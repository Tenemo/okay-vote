import dotenv from 'dotenv';
import type { PoolConfig } from 'pg';

dotenv.config();

const DEFAULT_DATABASE_URL =
    'postgres://postgres:postgres@localhost:5433/ov-db';
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_PORT = 4000;

const isAllowedLocalOrigin = (origin: string): boolean => {
    try {
        const url = new URL(origin);

        return (
            url.protocol === 'http:' &&
            (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
        );
    } catch {
        return false;
    }
};

const parsePort = (value: string | undefined): number => {
    const parsedPort = Number.parseInt(value ?? `${DEFAULT_PORT}`, 10);

    if (Number.isNaN(parsedPort)) {
        throw new TypeError('PORT must be a valid integer.');
    }

    return parsedPort;
};

const parseDatabaseSslOverride = (): PoolConfig['ssl'] | null => {
    const databaseSsl = process.env.DATABASE_SSL?.trim().toLowerCase();

    if (!databaseSsl) {
        return null;
    }

    return ['1', 'true', 'require'].includes(databaseSsl)
        ? { rejectUnauthorized: false }
        : false;
};

const shouldUseDatabaseSsl = (databaseUrl: string): boolean => {
    try {
        const { hostname } = new URL(databaseUrl);

        return hostname !== 'localhost' && hostname !== '127.0.0.1';
    } catch {
        return false;
    }
};

const parseAllowedOrigins = (): string[] =>
    (process.env.CORS_ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

export const config = {
    corsAllowedOrigins: parseAllowedOrigins(),
    databaseUrl: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    host: process.env.HOST ?? DEFAULT_HOST,
    logLevel: process.env.LOG_LEVEL ?? DEFAULT_LOG_LEVEL,
    port: parsePort(process.env.PORT),
};

export const getDatabaseSslConfig = (
    databaseUrl: string = config.databaseUrl,
): PoolConfig['ssl'] => {
    const override = parseDatabaseSslOverride();

    if (override !== null) {
        return override;
    }

    return shouldUseDatabaseSsl(databaseUrl)
        ? { rejectUnauthorized: false }
        : false;
};

export const isAllowedCorsOrigin = (origin?: string): boolean =>
    !origin ||
    isAllowedLocalOrigin(origin) ||
    config.corsAllowedOrigins.includes(origin);
