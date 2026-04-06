import 'fastify';
import type { Pool } from 'pg';

import type { Database } from 'db/connection';

declare module 'fastify' {
    interface FastifyInstance {
        db: Database;
        dbPool: Pool;
    }
}
