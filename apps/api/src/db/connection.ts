import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import dotenv from 'dotenv';
import { Pool, type PoolConfig } from 'pg';

import * as schema from 'db/schema';

dotenv.config();

const TIMEOUT = 30 * 1000;
const DEFAULT_DATABASE_URL =
    'postgres://postgres:postgres@localhost:5433/ov-db';

export type Database = NodePgDatabase<typeof schema>;

export type DatabaseClient = {
    db: Database;
    pool: Pool;
};

export const getDatabaseConnectionString = (): string =>
    process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

export const getDatabaseSslConfig = (
    connectionString: string,
): PoolConfig['ssl'] => {
    const databaseSsl = process.env.DATABASE_SSL?.toLowerCase();

    if (databaseSsl) {
        return ['1', 'true', 'require'].includes(databaseSsl)
            ? { rejectUnauthorized: false }
            : false;
    }

    try {
        const { hostname } = new URL(connectionString);

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return false;
        }
    } catch {
        return false;
    }

    return { rejectUnauthorized: false };
};

export const createDatabaseClient = (): DatabaseClient => {
    const connectionString = getDatabaseConnectionString();
    const pool = new Pool({
        connectionString,
        ssl: getDatabaseSslConfig(connectionString),
        statement_timeout: TIMEOUT,
        query_timeout: TIMEOUT,
        idle_in_transaction_session_timeout: TIMEOUT,
        connectionTimeoutMillis: TIMEOUT,
    });

    return {
        db: drizzle({ client: pool, schema }),
        pool,
    };
};
