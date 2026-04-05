import { createDatabaseClient } from 'db/connection';
import { migrateDatabase } from 'db/migrations';

const MAX_ATTEMPTS = 60;
const RETRY_DELAY_MS = 1000;

const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const initDatabase = async (): Promise<void> => {
    const { db, pool } = createDatabaseClient();

    try {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            try {
                await migrateDatabase(db);
                console.log('Database schema is ready.');
                return;
            } catch (error) {
                if (attempt === MAX_ATTEMPTS) {
                    throw error;
                }

                console.warn(
                    `Database not ready yet. Retry ${attempt}/${MAX_ATTEMPTS}.`,
                );
                await sleep(RETRY_DELAY_MS);
            }
        }
    } finally {
        await pool.end();
    }
};

void initDatabase().catch((error) => {
    console.error(error);
    process.exit(1);
});
