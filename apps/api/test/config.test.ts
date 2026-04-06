describe('getDatabaseSslConfig', () => {
    test('disables SSL for local database URLs', async () => {
        const { getDatabaseSslConfig } = await import('../src/config');

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
        const { getDatabaseSslConfig } = await import('../src/config');

        expect(
            getDatabaseSslConfig(
                'postgres://postgres:postgres@db.railway.internal:5432/ov-db',
            ),
        ).toEqual({
            rejectUnauthorized: false,
        });
    });

    test('falls back to no SSL for invalid database URLs', async () => {
        const { getDatabaseSslConfig } = await import('../src/config');

        expect(getDatabaseSslConfig('not-a-url')).toBe(false);
    });
});
