describe('getDatabaseSslConfig', () => {
    test('disables SSL for local database URLs', async () => {
        const { getDatabaseSslConfig } = await import('config');

        expect(
            getDatabaseSslConfig(
                'postgres://postgres:postgres@localhost:5433/ov-db',
            ),
        ).toBe(false);
        expect(
            getDatabaseSslConfig(
                'postgres://postgres:postgres@127.0.0.1:5433/ov-db',
            ),
        ).toBe(false);
    });

    test('enables SSL for remote database URLs', async () => {
        const { getDatabaseSslConfig } = await import('config');

        expect(
            getDatabaseSslConfig(
                'postgres://postgres:postgres@db.railway.internal:5432/ov-db',
            ),
        ).toEqual({
            rejectUnauthorized: false,
        });
    });

    test('falls back to no SSL for invalid database URLs', async () => {
        const { getDatabaseSslConfig } = await import('config');

        expect(getDatabaseSslConfig('not-a-url')).toBe(false);
    });
});

describe('config.logLevel', () => {
    const originalLogLevel = process.env.LOG_LEVEL;

    afterEach(() => {
        vi.resetModules();

        if (originalLogLevel === undefined) {
            delete process.env.LOG_LEVEL;
            return;
        }

        process.env.LOG_LEVEL = originalLogLevel;
    });

    test('falls back to the default log level for blank values', async () => {
        process.env.LOG_LEVEL = '   ';
        vi.resetModules();

        const { config } = await import('config');

        expect(config.logLevel).toBe('info');
    });

    test('rejects invalid log levels', async () => {
        process.env.LOG_LEVEL = 'verbose';
        vi.resetModules();

        await expect(import('config')).rejects.toThrow(
            'LOG_LEVEL must be one of:',
        );
    });
});
