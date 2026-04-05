import path from 'path';

import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { Pool } from 'pg';

import type { Database } from 'db/connection';

const MIGRATIONS_FOLDER = path.resolve(__dirname, '../../drizzle');

const RESET_DATABASE_SQL = `
DROP SCHEMA IF EXISTS drizzle CASCADE;
DROP TABLE IF EXISTS votes RESTRICT;
DROP TABLE IF EXISTS choices RESTRICT;
DROP TABLE IF EXISTS polls RESTRICT;
DROP EXTENSION IF EXISTS pgcrypto;
`;

export const migrateDatabase = async (db: Database): Promise<void> => {
    await migrate(db, {
        migrationsFolder: MIGRATIONS_FOLDER,
    });
};

export const resetDatabase = async (
    pool: Pool,
    db: Database,
): Promise<void> => {
    await pool.query(RESET_DATABASE_SQL);
    await migrateDatabase(db);
};
