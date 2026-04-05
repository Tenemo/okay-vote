import fs from 'fs';
import path from 'path';

import { buildServer } from '../server';

const createSqlPathCandidates = [
    path.resolve(__dirname, '../sql/create.sql'),
    path.resolve(__dirname, '../../src/sql/create.sql'),
];

const createSqlPath = createSqlPathCandidates.find((candidate) =>
    fs.existsSync(candidate),
);

if (!createSqlPath) {
    throw new Error('Could not locate create.sql for database initialization.');
}

const createSql = fs.readFileSync(createSqlPath, 'utf8');

const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 1000;

const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const initDatabase = async (): Promise<void> => {
    const app = await buildServer();

    try {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            try {
                await app.pg.query(createSql);
                app.log.info('Database schema is ready.');
                return;
            } catch (error) {
                if (attempt === MAX_ATTEMPTS) {
                    throw error;
                }

                app.log.warn(
                    `Database not ready yet. Retry ${attempt}/${MAX_ATTEMPTS}.`,
                );
                await sleep(RETRY_DELAY_MS);
            }
        }
    } finally {
        await app.close();
    }
};

void initDatabase().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
});
