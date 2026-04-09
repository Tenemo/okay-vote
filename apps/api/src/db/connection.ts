import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';

import { config, getDatabaseSslConfig } from 'config';
import * as schema from 'db/schema';

const TIMEOUT = 30 * 1000;

export type Database = NodePgDatabase<typeof schema>;

type DatabaseClient = {
    db: Database;
    pool: Pool;
};

const getDatabaseConnectionString = (): string => config.databaseUrl;

export const createDatabaseClient = (): DatabaseClient => {
    const connectionString = getDatabaseConnectionString();
    const poolConfig: PoolConfig = {
        connectionString,
        ssl: getDatabaseSslConfig(connectionString),
        statement_timeout: TIMEOUT,
        query_timeout: TIMEOUT,
        idle_in_transaction_session_timeout: TIMEOUT,
        connectionTimeoutMillis: TIMEOUT,
    };
    const pool = new Pool(poolConfig);

    return {
        db: drizzle({ client: pool, schema }),
        pool,
    };
};
