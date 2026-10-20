import { execSync } from 'node:child_process';

import { assertIsTestDatabase, testDatabaseUrl } from './database-url.js';

// Runs once before the whole test run. `migrate deploy` creates the database
// if it doesn't exist yet, then applies any pending migrations.
export default function setup(): void {
  assertIsTestDatabase(testDatabaseUrl);
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: 'pipe',
  });
}
