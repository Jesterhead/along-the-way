export const testDatabaseUrl =
  process.env['TEST_DATABASE_URL'] ?? 'postgresql://along:along@localhost:5433/along_test';

// Tests truncate every table, so refuse to run against anything that isn't
// clearly a throwaway test database (e.g. a dev database set via TEST_DATABASE_URL).
export function assertIsTestDatabase(url: string): void {
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests against database "${name}": its name must end in "_test".`,
    );
  }
}
