import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { createDatabaseClient } from 'db/connection';

const DEFAULT_DATABASE_URL =
    'postgres://postgres:postgres@localhost:5433/ov-db';

const RESET_DATABASE_SQL = `
DROP SCHEMA IF EXISTS drizzle CASCADE;
DROP TABLE IF EXISTS votes RESTRICT;
DROP TABLE IF EXISTS choices RESTRICT;
DROP TABLE IF EXISTS polls RESTRICT;
DROP EXTENSION IF EXISTS pgcrypto;
`;

const INSERT_LEGACY_POLLS_SQL =
    'INSERT INTO "polls" ("id", "poll_name") VALUES ' +
    "('00000000-0000-4000-8000-000000000001', 'Team lunch'), " +
    "('00000000-0000-4000-8000-000000000002', 'Team lunch'), " +
    "('00000000-0000-4000-8000-000000000003', '???');";

const SELECT_BACKFILLED_POLLS_SQL =
    'SELECT "id", "slug", "ended_at" FROM "polls" ORDER BY "id" ASC;';

const readMigrationFile = async (filename: string): Promise<string> =>
    readFile(
        fileURLToPath(new URL(`../../drizzle/${filename}`, import.meta.url)),
        'utf8',
    );

const applyMigrationSql = async (
    pool: ReturnType<typeof createDatabaseClient>['pool'],
    filename: string,
): Promise<void> => {
    const sql = await readMigrationFile(filename);
    const statements = sql
        .split('--> statement-breakpoint')
        .map((statement) => statement.trim())
        .filter(Boolean);

    for (const statement of statements) {
        await pool.query(statement);
    }
};

describe('database migrations', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalDatabaseUrl = process.env.DATABASE_URL;

    beforeAll(() => {
        process.env.NODE_ENV = 'test';
        process.env.DATABASE_URL =
            process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
    });

    afterAll(() => {
        if (originalNodeEnv === undefined) {
            delete process.env.NODE_ENV;
        } else {
            process.env.NODE_ENV = originalNodeEnv;
        }

        if (originalDatabaseUrl === undefined) {
            delete process.env.DATABASE_URL;
        } else {
            process.env.DATABASE_URL = originalDatabaseUrl;
        }
    });

    test('backfills slugs and marks legacy polls as ended before enforcing constraints', async () => {
        const { pool } = createDatabaseClient();

        try {
            await pool.query(RESET_DATABASE_SQL);
            await applyMigrationSql(pool, '0000_init.sql');
            await applyMigrationSql(pool, '0001_polite_callisto.sql');

            await pool.query(INSERT_LEGACY_POLLS_SQL);

            await applyMigrationSql(pool, '0002_nervous_imperial_guard.sql');
            await applyMigrationSql(pool, '0003_superb_thunderbolt.sql');

            const { rows } = await pool.query<{
                ended_at: unknown;
                id: string;
                slug: string;
            }>(SELECT_BACKFILLED_POLLS_SQL);

            expect(rows).toHaveLength(3);
            expect(rows).toEqual([
                expect.objectContaining({
                    id: '00000000-0000-4000-8000-000000000001',
                    slug: 'team-lunch--00000000000040008000000000000001',
                }),
                expect.objectContaining({
                    id: '00000000-0000-4000-8000-000000000002',
                    slug: 'team-lunch--00000000000040008000000000000002',
                }),
                expect.objectContaining({
                    id: '00000000-0000-4000-8000-000000000003',
                    slug: 'vote--00000000000040008000000000000003',
                }),
            ]);
            expect(rows.every(({ ended_at }) => ended_at !== null)).toBe(true);
        } finally {
            await pool.query(RESET_DATABASE_SQL);
            await pool.end();
        }
    });
});
