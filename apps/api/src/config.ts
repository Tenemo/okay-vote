import dotenv from 'dotenv';
import type { PoolConfig } from 'pg';

dotenv.config();

const DEFAULT_DATABASE_URL =
    'postgres://postgres:postgres@localhost:5433/ov-db';
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_PORT = 4000;
const LOG_LEVELS = [
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'silent',
] as const;

type LogLevel = (typeof LOG_LEVELS)[number];

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

const parseHost = (value: string | undefined): string => {
    const host = value?.trim();

    return host ? host : DEFAULT_HOST;
};

const parseLogLevel = (value: string | undefined): LogLevel => {
    const logLevel = value?.trim();

    if (!logLevel) {
        return DEFAULT_LOG_LEVEL;
    }

    if (!LOG_LEVELS.includes(logLevel as LogLevel)) {
        throw new TypeError(
            `LOG_LEVEL must be one of: ${LOG_LEVELS.join(', ')}.`,
        );
    }

    return logLevel as LogLevel;
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
    host: parseHost(process.env.HOST),
    logLevel: parseLogLevel(process.env.LOG_LEVEL),
    port: parsePort(process.env.PORT),
};

export const getDatabaseSslConfig = (
    databaseUrl: string = config.databaseUrl,
): PoolConfig['ssl'] =>
    shouldUseDatabaseSsl(databaseUrl) ? { rejectUnauthorized: false } : false;

export const isAllowedCorsOrigin = (origin?: string): boolean =>
    !origin ||
    isAllowedLocalOrigin(origin) ||
    config.corsAllowedOrigins.includes(origin);
